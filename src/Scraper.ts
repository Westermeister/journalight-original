/**
 * Provides Scraper class and related types.
 * @module Scraper
 */
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import puppeteer from "puppeteer-extra";
import { Browser, Page } from "puppeteer";
import tokenizer from "sbd";

import { Logger } from "./Logger";
import { Queue } from "./Queue";

/**
 * Stores multiple news feeds.
 * @property [source] - Name of a source e.g. "pbs". Will correspond to its news feed.
 */
interface ScraperMultifeed {
  [source: string]: Array<ScraperFeedItem>;
}

/**
 * Stores a single news feed item.
 * @property text - Can be either a full article, or just a summary lead.
 * @property needs_summary - True for full articles, false for summary leads. Used as a flag for postprocessing.
 * @property url - Corresponds to the webpage where the text was scraped from.
 */
interface ScraperFeedItem {
  text: string;
  needs_summary: boolean;
  url: string;
}

/**
 * Scrapes news articles from a variety of news sources.
 * Currently supports: PBS, NPR, UPI
 */
class Scraper {
  private storage: ScraperMultifeed;
  private pbs_queue: Queue<string>;
  private npr_queue: Queue<string>;
  private upi_queue: Queue<string>;
  private logger: Logger;

  /**
   * Initialize scraper.
   * @param sites_to_scrape - Decides which sites are scraped.
   */
  constructor(sites_to_scrape: { pbs: boolean; npr: boolean; upi: boolean }) {
    // Initialize queues for all sites.
    this.pbs_queue = new Queue();
    this.npr_queue = new Queue();
    this.upi_queue = new Queue();

    // Only allocate storage and an initial URL if we're going to actually scrape them.
    // Otherwise, we don't want an empty storage field, and there should be nothing in the queue.
    this.storage = {};
    if (sites_to_scrape.pbs) {
      this.storage.pbs = [];
      this.pbs_queue.enqueue("https://www.pbs.org/newshour/latest");
    }
    if (sites_to_scrape.npr) {
      this.storage.npr = [];
      this.npr_queue.enqueue("https://www.npr.org/sections/news/");
    }
    if (sites_to_scrape.upi) {
      this.storage.upi = [];
      this.upi_queue.enqueue("https://www.upi.com/Top_News/");
    }

    // Help save bandwidth.
    puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

    this.logger = new Logger("Scraper");
  }

  /**
   * Runs the scraper. Opens Puppeteer pages for each site, and scrapes them concurrently.
   * @returns The resulting news feed.
   */
  async run(): Promise<ScraperMultifeed> {
    const browser: Browser = await puppeteer.launch({ headless: true });

    const pbs_page: Page = await browser.newPage();
    const npr_page: Page = await browser.newPage();
    const upi_page: Page = await browser.newPage();

    const pbs_promise: Promise<void> = this.pbs_manager(pbs_page);
    const npr_promise: Promise<void> = this.npr_manager(npr_page);
    const upi_promise: Promise<void> = this.upi_manager(upi_page);

    await Promise.all([pbs_promise, npr_promise, upi_promise]);
    await browser.close();
    this.logger.debug(
      `Returning entire scraped data: ${JSON.stringify(this.storage)}`
    );
    return this.storage;
  }

  /**
   * Gets ~10 (or less) of the latest news from PBS NewsHour.
   * Can be either summary leads or full articles.
   * @param page - Used to access and scrape each page.
   */
  private async pbs_manager(page: Page): Promise<void> {
    while (!this.pbs_queue.empty()) {
      const next_page: string = this.pbs_queue.dequeue();
      await page.goto(next_page);
      await this.pbs_pager(page);
    }
  }

  /**
   * Gets ~10 (or less) of the top articles from NPR's news section.
   * @param page - Used to access and scrape each page.
   */
  private async npr_manager(page: Page): Promise<void> {
    while (!this.npr_queue.empty()) {
      const next_page: string = this.npr_queue.dequeue();
      await page.goto(next_page);
      await this.npr_pager(page);
    }
  }

  /**
   * Gets summary leads from 10 of the top articles from UPI's "Top News" section.
   * @param page - Used to access and scrape each page.
   */
  private async upi_manager(page: Page): Promise<void> {
    while (!this.upi_queue.empty()) {
      const next_page: string = this.upi_queue.dequeue();
      await page.goto(next_page);
      await this.upi_pager(page);
    }
  }

  /**
   * Handles scraping pages for PBS.
   * @param page - Page to scrape.
   */
  private async pbs_pager(page: Page) {
    // Respect robots.txt crawl-delay of 2 seconds (and a bit more).
    await page.waitForTimeout((Math.random() + 1) * 2000);

    // Case 1: We're at the initial link i.e. the list of posts.
    if (page.url() === "https://www.pbs.org/newshour/latest") {
      const articles = await page.evaluate(() => {
        const nodes = <NodeListOf<HTMLAnchorElement>>(
          document.querySelectorAll("a.card-timeline__title")
        );
        const retval: Array<string> = Array.from(nodes).map((i) => i.href);
        return retval;
      });
      for (const link of articles) {
        this.pbs_queue.enqueue(link);
      }
    }

    // Case 2: We're at a post!
    else {
      // The first kind of post is actually a transcription of a broadcast, but you
      // can generally expect a good summary lead. Thus, we'll extract it.
      const is_transcript = await page.evaluate(() => {
        return document.getElementById("transcript") !== null;
      });
      if (is_transcript) {
        const data = await page.evaluate(() => {
          const data = {
            needs_summary: false,
            remove_last_sentence: false,
            cancel: false,
            text: "",
            url: "",
          };
          data.text = (<HTMLParagraphElement>(
            document.querySelector("div#transcript p")
          )).innerText;
          // Sometimes, PBS has interviews with people over things that aren't "actual" news. We also
          // sometimes see more "mini-doc" pieces, which aren't specifically about reporting on current
          // events. We abort scraping in these cases.
          if (
            data.text.includes("new book") ||
            data.text.includes("new report") ||
            data.text.includes("special report") ||
            data.text.includes("series")
          ) {
            data.cancel = true;
            return data;
          }
          // Transcriptions that don't belong to "News Wrap" broadcasts tend to have an
          // introductory sentence at the end for the transcription. Should be removed.
          const title_node: HTMLTitleElement | null =
            document.querySelector("title");
          if (title_node === null) return null;
          const title = title_node.innerText;
          if (!title.startsWith("News Wrap")) {
            data.remove_last_sentence = true;
          } else {
            // If we have a news wrap, we get the format: "In our news wrap [INSERT DAY HERE], blah blah..."
            // Let's make that lead more concise.
            data.text = data.text.replace("In our news wrap", "This");
          }
          return data;
        });
        if (data === null) {
          this.logger.error(
            `Tried to scrape page, but got null: ${page.url()}`
          );
          process.exit(1);
        }
        // Handle the cancellation key if true.
        if (data.cancel) {
          return;
        }
        // Remove the last sentence if needed.
        if (data.remove_last_sentence) {
          const sentences = tokenizer.sentences(data.text);
          sentences.pop();
          data.text = sentences.join(" ");
        }
        // One more thing: what if by removing the last sentence, there's no longer any
        // text? This is a special case. It basically means that the transcript's lead
        // was actually mostly an introduction and doesn't contain a meaningful news
        // summary. So, there being nothing of interest, we simply move on.
        if (data.text === "") return;
        data.url = page.url();
        const news_feed_item: ScraperFeedItem = {
          text: data.text,
          needs_summary: data.needs_summary,
          url: data.url,
        };
        this.logger.debug(`Storing scraped data: ${JSON.stringify(data)}`);
        this.storage.pbs.push(news_feed_item);
      } else {
        /*
            The second kind of post is an actual article that was written by a journalist.
            There's a peculiar way to tell if we can get a quality summary lead out of the article.
            I've noticed a pattern for such leads, as they seem to ALWAYS have the following
            format: LOCATION [insert optional (AP) including parentheses] — [insert summary lead]
            e.g. "WASHINGTON (AP) - This week, President Trump announced that..."
                "NEW YORK — New York Gov. Andrew Cuomo released a statement saying..."
            What do they all have in common? The em dash: — So if we see that in the first
            paragraph, we'll extract it, otherwise, we'll get the entire article.
            */
        const data = await page.evaluate(() => {
          const first_paragraph_node: HTMLParagraphElement | null =
            document.querySelector("div.body-text > p");
          if (first_paragraph_node === null) return null;
          const first_paragraph: string = first_paragraph_node.innerText;
          if (first_paragraph.includes("—")) {
            const data: ScraperFeedItem = {
              text: "",
              needs_summary: false,
              url: "",
            };
            data.text = first_paragraph.substr(
              first_paragraph.indexOf("—") + 2
            );
            return data;
          } else {
            const data: ScraperFeedItem = {
              text: "",
              needs_summary: true,
              url: "",
            };
            const nodes = <NodeListOf<HTMLParagraphElement>>(
              document.querySelectorAll("div.body-text > p")
            );
            const paragraphs: Array<string> = Array.from(nodes).map(
              (i) => i.innerText
            );
            for (let i = paragraphs.length - 1; i >= 0; --i) {
              if (
                paragraphs[i].startsWith("READ MORE") ||
                paragraphs[i].startsWith("Watch")
              ) {
                paragraphs.splice(i, 1);
              }
            }
            data.text = paragraphs.join(" ");
            return data;
          }
        });
        if (data === null) {
          this.logger.error(
            `Tried to scrape page, but got null: ${page.url()}`
          );
          process.exit(1);
        }
        data.url = page.url();
        this.logger.debug(`Storing scraped data: ${JSON.stringify(data)}`);
        this.storage.pbs.push(data);
      }
    }
  }

  /**
   * Handles scraping pages for NPR.
   * @param page - Page to scrape.
   */
  private async npr_pager(page: Page) {
    // No crawl-delay specified, wait maybe 10-20 seconds (arbitrary).
    await page.waitForTimeout((Math.random() + 1) * 10e3);

    // Case 1: We're in the news section.
    if (page.url() === "https://www.npr.org/sections/news/") {
      const article_links: Array<string> = await page.evaluate(() => {
        const article_nodes: NodeListOf<HTMLAnchorElement> =
          document.querySelectorAll("h2.title > a");
        const article_links: Array<string> = Array.from(article_nodes)
          .slice(0, 10)
          .map((i) => i.href);
        // NPR sometimes has articles that are more like mini-docs, and not really about current events.
        // NPR also sometimes does book reviews. We want neither of these, so let's purge them.
        const section_nodes: NodeListOf<HTMLAnchorElement> =
          document.querySelectorAll("div.slug-wrap > h3.slug > a");
        const section_links: Array<string> = Array.from(section_nodes)
          .slice(0, 10)
          .map((i) => i.href);
        // Note the the article/section links' indices correspond to one another.
        // e.g. section_link[0] is the section link for article_link[0], etc.
        for (let i = section_links.length - 1; i >= 0; --i) {
          if (
            section_links[i].includes("/series/") ||
            section_links[i].includes("/book-reviews/")
          ) {
            article_links.splice(i, 1);
          }
        }
        return article_links;
      });
      for (const link of article_links) {
        this.npr_queue.enqueue(link);
      }
    }

    // Case 2: We're at an article.
    else {
      const article: string = await page.evaluate(() => {
        const paragraph_nodes: NodeListOf<HTMLParagraphElement> =
          document.querySelectorAll("div#storytext > p");
        const paragraphs: Array<string> = Array.from(paragraph_nodes).map(
          (i) => i.innerText
        );
        // Sometimes an editor's note is in the place of the lead. Skip it.
        if (paragraphs[0].startsWith("Editor's note")) {
          paragraphs.splice(0, 1);
        }
        // Also: remove section headers, which aren't part of the main text.
        const header_nodes: NodeListOf<HTMLElement> = document.querySelectorAll(
          "div#storytext > p > strong"
        );
        const headers: Array<string> = Array.from(header_nodes).map(
          (i) => i.innerText
        );
        for (let i = paragraphs.length - 1; i >= 0; --i) {
          if (headers.includes(paragraphs[i])) {
            paragraphs.splice(i, 1);
          }
        }
        const whole_text = paragraphs.join(" ");
        return whole_text;
      });
      const news_feed_item: ScraperFeedItem = {
        text: article,
        needs_summary: true,
        url: page.url(),
      };
      this.logger.debug(
        `Storing scraped data: ${JSON.stringify(news_feed_item)}`
      );
      this.storage.npr.push(news_feed_item);
    }
  }

  /**
   * Handles scraping pages for UPI.
   * @param page - Page to scrape.
   */
  private async upi_pager(page: Page) {
    // No crawl-delay specified, wait maybe 10-20 seconds (arbitrary).
    await page.waitForTimeout((Math.random() + 1) * 10e3);

    // Case 1: We're in the top news section.
    if (page.url() === "https://www.upi.com/Top_News/") {
      // Because of the way the page is formatted, we can actually get quite a bit of summaries just from here.
      const pairs: { texts: Array<string>; urls: Array<string> } =
        await page.evaluate(() => {
          const summary_nodes: NodeListOf<HTMLDivElement> =
            document.querySelectorAll("div.content");
          const summaries: Array<string> = Array.from(summary_nodes)
            .slice(0, 7)
            .map((i) => i.innerText);
          for (let i = 0; i < summaries.length; ++i) {
            // The ") -- " sequence separates a date from a summary lead e.g. "(UPI) -- Breaking news, ..."
            // It's possible that there's no ") -- " sequence.
            // That can happen for "on this day" and "news quiz" posts, which aren't about current events.
            // In that case, they'll be removed by code later in this method.
            if (summaries[i].includes(") -- ")) {
              const dash_index = summaries[i].indexOf(") -- ");
              // It's possible that we have this in the middle
              summaries[i] = summaries[i].substr(dash_index + 5);
            }
          }
          // Remember to get the associated URLs.
          const url_nodes: NodeListOf<HTMLAnchorElement> =
            document.querySelectorAll("a.row");
          const urls: Array<HTMLAnchorElement> = Array.from(url_nodes).slice(
            0,
            7
          );
          // One more thing before we map to hrefs and call it a day...
          // ...UPI sometimes has "on this day" and "news quiz" posts. We don't want those.
          for (let i = urls.length - 1; i >= 0; --i) {
            if (
              urls[i].title.includes("On This Day") ||
              urls[i].title.includes("News Quiz")
            ) {
              urls.splice(i, 1);
              summaries.splice(i, 1);
            }
          }
          return { texts: summaries, urls: urls.map((i) => i.href) };
        });
      for (let i = 0; i < pairs.texts.length; ++i) {
        const news_feed_item: ScraperFeedItem = {
          text: pairs.texts[i],
          needs_summary: false,
          url: pairs.urls[i],
        };
        this.logger.debug(
          `Storing scraped data: ${JSON.stringify(news_feed_item)}`
        );
        this.storage.upi.push(news_feed_item);
      }
      // Now we go back and get the 3 specially-formatted posts.
      const other_links: Array<string> = await page.evaluate(() => {
        const nodes: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
          "a.col-md-4.col-sm-4"
        );
        const nodes_arr: Array<HTMLAnchorElement> = Array.from(nodes);
        // Again, remove "on this day" and "news quiz" posts.
        for (let i = nodes_arr.length - 1; i >= 0; --i) {
          if (
            nodes_arr[i].title.includes("On This Day") ||
            nodes_arr[i].title.includes("News Quiz")
          ) {
            nodes_arr.splice(i, 1);
          }
        }
        const links: Array<string> = nodes_arr.map((i) => i.href);
        return links;
      });
      for (const link of other_links) {
        this.upi_queue.enqueue(link);
      }
    }

    // Case 2: We're at an article.
    else {
      const summary: string | null = await page.evaluate(() => {
        const summary_node: HTMLParagraphElement | null =
          document.querySelector("article > p");
        if (summary_node === null) return null;
        let summary: string = summary_node.innerText;
        summary = summary.substr(summary.indexOf("-- ") + 3);
        return summary;
      });
      if (summary === null) {
        this.logger.error(`Tried to scrape page, but got null: ${page.url()}`);
        process.exit(1);
      }
      const news_feed_item: ScraperFeedItem = {
        text: summary,
        needs_summary: false,
        url: page.url(),
      };
      this.logger.debug(
        `Storing scraped data: ${JSON.stringify(news_feed_item)}`
      );
      this.storage.upi.push(news_feed_item);
    }
  }
}

export { Scraper, ScraperMultifeed };
