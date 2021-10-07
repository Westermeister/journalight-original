/**
 * Provides a string archiver class.
 * @module Archiver
 */

import BetterSqlite3 from "better-sqlite3";

/** Responsible for filtering and archiving strings with a database. */
class Archiver {
  private db: BetterSqlite3.Database;

  /** Create the database. */
  constructor() {
    this.db = new BetterSqlite3(".archive.sqlite");
    this.db
      .prepare(
        "CREATE TABLE IF NOT EXISTS archive (string TEXT PRIMARY KEY, timestamp TEXT)"
      )
      .run();
  }

  /**
   * Filters out strings that are already in the database, and adds the remaining strings to the database.
   * @param feed - The strings to run through the archiving process.
   * @returns The filtered input.
   */
  run(this: Archiver, feed: Array<string>): Array<string> {
    const retval = this.filter_old(feed);
    this.archive(retval);
    return retval;
  }

  /**
   * Filters out strings that are already in the database.
   * @param feed - Each string will be checked against the database.
   * @returns The filtered feed.
   */
  private filter_old(this: Archiver, feed: Array<string>): Array<string> {
    for (let i = feed.length - 1; i >= 0; --i) {
      const exists = !!this.db
        .prepare("SELECT 1 FROM archive WHERE string = ?")
        .get(feed[i]);
      if (!exists) {
        continue;
      }
      feed.splice(i, 1);
    }
    return feed;
  }

  /**
   * Adds strings to the database. In order to prevent infinite growth, very old strings are occasionally removed.
   * @param feed - The strings to add to the database.
   */
  private archive(this: Archiver, feed: Array<string>): void {
    for (const string of feed) {
      const cmd = this.db.prepare(
        "INSERT INTO archive (string, timestamp) VALUES (?, ?)"
      );
      cmd.run(string, new Date().toISOString());
    }
    const size = this.db.prepare("SELECT COUNT(1) FROM archive").get()[
      "COUNT(1)"
    ];
    // Arbitrary limit.
    if (size > 1000) {
      const cmd = this.db.prepare(
        "DELETE FROM archive WHERE timestamp IN " +
          "(SELECT timestamp FROM archive ORDER BY timestamp ASC LIMIT 100)"
      );
      cmd.run();
    }
  }
}

export { Archiver };
