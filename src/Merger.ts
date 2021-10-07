/**
 * Provides Merger class.
 * @module Merger
 */

interface MultiFeed {
  [source: string]: Array<any>;
}

/** Responsible for merging feeds from multiple sources into a single feed. */
class Merger {
  /**
   * Runs the merger.
   * @param feed - The feed.
   * @param max - The max length of the final feed. Should not be smaller than the number of sources.
   * @returns The merged feed.
   */
  run(feed: MultiFeed, max: number): Array<any> {
    const concise_feed: MultiFeed = this.cap_length(feed, max);
    const single_feed: Array<any> = this.random_collate(concise_feed);
    return single_feed;
  }

  /**
   * Caps the length of the feed by removing from the longest source.
   * @param feed - The feed.
   * @param max - The max length of the final feed. Should not be smaller than the number of sources.
   * @returns The pruned feed.
   */
  private cap_length(feed: MultiFeed, max: number): MultiFeed {
    while (this.total_length(feed) > max) {
      let current_max_source = "";
      let current_max_source_length = 0;
      for (const source in feed) {
        if (feed[source].length > current_max_source_length) {
          current_max_source = source;
          current_max_source_length = feed[source].length;
        }
      }
      feed[current_max_source].pop();
    }
    return feed;
  }

  /**
   * Calculates the total length of the feed across all sources.
   * @param feed - The feed.
   * @returns The total length.
   */
  private total_length(feed: MultiFeed): number {
    let total = 0;
    for (const source in feed) {
      total += feed[source].length;
    }
    return total;
  }

  /**
   * Combines the feed items in a random order. The randomness helps avoid bias towards any particular source.
   * @param feed - The feed.
   * @returns The combined feed.
   */
  private random_collate(feed: MultiFeed): Array<any> {
    let retval: Array<any> = [];
    for (const source in feed) {
      for (let i = 0; i < feed[source].length; ++i) {
        retval.push(feed[source][i]);
      }
    }
    retval = this.shuffle_array(retval);
    return retval;
  }

  /**
   * Shuffles an array using the Durstenfeld algorithm.
   * See: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
   * @param array - The array to shuffle.
   * @returns The shuffled array.
   */
  private shuffle_array(array: Array<any>): Array<any> {
    for (let i = array.length - 1; i > 0; --i) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export { Merger };
