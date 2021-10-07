/**
 * Provides App class, relevant types, and CLI.
 * @module
 */

// Before we do anything else, load env vars.
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { spawn } from "child_process";

import Mailgun from "mailgun.js";
import FormData from "form-data";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Archiver } from "./Archiver.js";
import { Logger } from "./Logger.js";
import { Merger } from "./Merger.js";
import { Scraper, ScraperMultifeed } from "./Scraper.js";

/**
 * Configuration for the app.
 * @property mail - Whether or not to mail the feed. Requires certain env vars to be set.
 * @property archive - Whether to use archiving functionality to filter already-seen news between runs.
 * @property sites - Controls which sites are scraped.
 * @property sites.pbs - Whether or not to scrape PBS.
 * @property sites.npr - Whether or not to scrape NPR.
 * @property sites.upi - Whether or not to scrape UPI.
 */
interface AppOptions {
  mail: boolean;
  archive: boolean;
  sites: {
    pbs: boolean;
    npr: boolean;
    upi: boolean;
  };
}

/**
 * Same as ScraperFeed, but features SummaryFeedItem instead of ScraperFeedItem.
 * @property [source] - Name of a source, which will correspond to a feed of SummaryFeedItems.
 */
interface SummaryMultifeed {
  [source: string]: Array<SummaryFeedItem>;
}

/**
 * Same as ScraperFeedItem, but with no "needs_summary" key, as "text" is presumed to be a summary.
 * @property text - Summary of a news article; should be no larger than about a short paragraph.
 * @property url - URL corresponding to the webpage where the summary was derived from.
 */
interface SummaryFeedItem {
  text: string;
  url: string;
}

/**
 * Same as SummaryMultifeed, but features an array of strings instead of objects with "text" and "url" keys.
 * Essentially, it's just removing the "url" key and "un-objectifying" the SummaryFeedItems.
 * @property [source] - Name of a source, which will correspond to an array of strings.
 */
interface TextOnlyMultifeed {
  [source: string]: Array<string>;
}

/** Top-level class that serves as entry point, intermediary for other classes, and output handler. */
class App {
  private option_mail: boolean;
  private option_archive: boolean;
  private scraper: Scraper;
  private merger: Merger;
  private logger: Logger;

  /**
   * Configure app and initialize required classes.
   * @param options - Configuration properties.
   */
  constructor(options: AppOptions) {
    this.option_mail = options.mail;
    this.option_archive = options.archive;
    this.scraper = new Scraper(options.sites);
    this.merger = new Merger();
    this.logger = new Logger("App");
  }

  /** Calls necessary classes to make a news feed, and outputs it. */
  async run(this: App) {
    this.logger.info("Scraping news articles (may take a few minutes)");
    let feed: any = await this.scraper.run();

    if (this.option_archive) {
      this.logger.info(
        "Filtering out already-seen articles (and marking remaining articles as seen)"
      );
      feed = this.archive(feed);
    }

    this.logger.info("Summarizing articles");
    feed = await this.summarize(feed);

    this.logger.info("Removing semantic duplicates of summaries across sites");
    feed = await this.dedupe(feed);

    this.logger.info("Merging summaries across sites into single feed");
    feed = await this.merge(feed);

    const pretty_feed: string = this.prettify(feed);
    if (this.option_mail) {
      this.logger.info("Mailing feed");
      await this.mail(pretty_feed);
    } else {
      this.logger.info("Printing feed to console");
      console.log(pretty_feed);
    }
  }

  /**
   * Filters out feed items that were already seen, and marks the rest as seen.
   * @param feed - The raw scraped feed (before any further processing is done).
   * @returns Input, but with <= the original number of feed items.
   */
  private archive(this: App, feed: ScraperMultifeed): ScraperMultifeed {
    const archiver: Archiver = new Archiver();
    const urls: Array<string> = [];
    for (const source in feed) {
      for (const obj of feed[source]) {
        urls.push(obj.url);
      }
    }
    const allowed_urls: Array<string> = archiver.run(urls);
    for (const source in feed) {
      for (let i = feed[source].length - 1; i >= 0; --i) {
        const url_candidate: string = feed[source][i].url;
        if (!allowed_urls.includes(url_candidate)) {
          feed[source].splice(i, 1);
        }
      }
    }
    return feed;
  }

  /**
   * Summarizes any feed items that need it.
   * @param feed - The scraped feed of full articles or summary leads.
   * @returns The input, but with full articles reduced to summaries.
   */
  private async summarize(
    this: App,
    feed: ScraperMultifeed
  ): Promise<SummaryMultifeed> {
    const articles: Array<string> = [];
    for (const source in feed) {
      for (let i = 0; i < feed[source].length; ++i) {
        if (feed[source][i].needs_summary) {
          articles.push(feed[source][i].text);
        }
      }
    }
    const json_articles: string = JSON.stringify(articles);
    const json_summaries: string = await this._pycall(
      "./src/Summarizer.py",
      json_articles
    );
    const summaries = JSON.parse(json_summaries);
    for (const source in feed) {
      for (let i = 0; i < feed[source].length; ++i) {
        if (feed[source][i].needs_summary) {
          feed[source][i].text = summaries.shift();
        }
      }
    }
    const new_feed: SummaryMultifeed = {};
    for (const source in feed) {
      new_feed[source] = [];
      for (let i = 0; i < feed[source].length; ++i) {
        const item: SummaryFeedItem = {
          text: feed[source][i].text,
          url: feed[source][i].url,
        };
        new_feed[source].push(item);
      }
    }
    return new_feed;
  }

  /**
   * Removes semantic duplicates of summaries across different news sources.
   * @param feed - The feed of summaries.
   * @returns The feed, but with semantic duplicates gone.
   */
  private async dedupe(
    this: App,
    feed: SummaryMultifeed
  ): Promise<SummaryMultifeed> {
    const input: TextOnlyMultifeed = JSON.parse(JSON.stringify(feed));
    for (const source in feed) {
      input[source] = [];
      for (let i = 0; i < feed[source].length; ++i) {
        input[source].push(feed[source][i].text);
      }
    }
    const json_input: string = JSON.stringify(input);
    const json_result: string = await this._pycall(
      "./src/Deduper.py",
      json_input
    );
    const result: TextOnlyMultifeed = JSON.parse(json_result);
    for (const source in feed) {
      for (let i = feed[source].length - 1; i >= 0; --i) {
        let in_result = false;
        for (let j = 0; j < result[source].length; ++j) {
          if (feed[source][i].text === result[source][j]) {
            in_result = true;
          }
        }
        if (!in_result) {
          feed[source].splice(i, 1);
        }
      }
    }
    return feed;
  }

  /**
   * Merges feed from several news sources into single feed.
   * @param feed - The summary feed.
   * @returns An array of summarized feed items.
   */
  private async merge(
    this: App,
    feed: SummaryMultifeed
  ): Promise<Array<SummaryFeedItem>> {
    const input: TextOnlyMultifeed = JSON.parse(JSON.stringify(feed));
    for (const source in feed) {
      input[source] = [];
      for (let i = 0; i < feed[source].length; ++i) {
        input[source].push(feed[source][i].text);
      }
    }
    // Arbitrary limit on max feed size.
    const result: Array<string> = this.merger.run(input, 15);
    const retval: Array<SummaryFeedItem> = [];
    for (let i = 0; i < result.length; ++i) {
      get_corresponding_url: for (const source in feed) {
        for (let j = 0; j < feed[source].length; ++j) {
          if (result[i] === feed[source][j].text) {
            const corresponding_url = feed[source][j].url;
            const feed_item: SummaryFeedItem = {
              text: result[i],
              url: corresponding_url,
            };
            retval.push(feed_item);
            break get_corresponding_url;
          }
        }
      }
    }
    return retval;
  }

  /**
   * Formats the feed into a prettified string for human readability.
   * @param feed - A single feed of summaries.
   * @returns The prettified string.
   */
  private prettify(this: App, feed: Array<SummaryFeedItem>): string {
    const current_date: string = new Date().toString().substr(0, 15);
    let text = `${current_date}\n\nGood day. Your news briefing:\n\n`;
    for (let i = 0; i < feed.length; ++i) {
      text += `${i + 1}. ${feed[i]["text"]}\n\n`;
    }
    text += "Sources:\n";
    for (let i = 0; i < feed.length; ++i) {
      text += `${i + 1}. ${feed[i]["url"]}\n`;
    }
    return text;
  }

  /**
   * Mails the feed using Mailgun ft. env vars for configuration.
   * @param pretty_feed - The prettified feed.
   */
  private async mail(this: App, pretty_feed: string) {
    if (
      !process.env.FROM ||
      !process.env.TO ||
      !process.env.MAILGUN_API_KEY ||
      !process.env.MAILGUN_DOMAIN
    ) {
      this.logger.error(
        "Missing required env variables for mailing functionality!"
      );
      process.exit(1);
    }
    const current_date: string = new Date().toString().substr(0, 15);
    const mail: { from: string; to: string; subject: string; text: string } = {
      from: process.env.FROM,
      to: process.env.TO,
      subject: `Journalight: ${current_date}`,
      text: pretty_feed,
    };
    // Need "as any", see: https://github.com/mailgun/mailgun-js/pull/111#issuecomment-791011724
    const mailgun: Mailgun = new Mailgun(FormData as any);
    const client = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });
    try {
      await client.messages.create(process.env.MAILGUN_DOMAIN, mail);
    } catch (e) {
      this.logger.error(e as string);
    }
  }

  /**
   * Call a Python script and write once to stdin, then read once from stdout.
   * @param file - Python script to call.
   * @param input - String that will be written to Python script's stdin.
   * @returns The stdout from the Python script.
   */
  private async _pycall(
    this: App,
    file: string,
    input: string
  ): Promise<string> {
    const pyprocess = spawn("python", [file]);
    pyprocess.stdin.write(input);
    pyprocess.stdin.end();
    return await new Promise((resolve) =>
      pyprocess.stdout.on("data", (data) => resolve(data.toString()))
    );
  }
}

if (require.main === module) {
  // Using a slight variant of this fix: https://github.com/yargs/yargs/issues/1455#issuecomment-566807581
  const argv = (yargs(hideBin(process.argv)) as any).options({
    mail: { type: "boolean", default: false },
    archive: { type: "boolean", default: false },
    all: { type: "boolean", default: false },
    pbs: { type: "boolean", default: false },
    npr: { type: "boolean", default: false },
    upi: { type: "boolean", default: false },
  }).argv;
  const options: AppOptions = {
    mail: !!argv.mail,
    archive: !!argv.archive,
    sites: {
      pbs: !!argv.pbs,
      npr: !!argv.npr,
      upi: !!argv.upi,
    },
  };
  if (argv.all) {
    options.sites = {
      pbs: true,
      npr: true,
      upi: true,
    };
  }
  if (!argv.all && !argv.pbs && !argv.npr && !argv.upi) {
    console.error(
      "At least one site must be set to true, otherwise there is no news to get!"
    );
    process.exit(1);
  }
  const app: App = new App(options);
  app.run();
}
