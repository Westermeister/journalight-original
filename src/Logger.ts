/**
 * Provides a file logger.
 * @module Logger
 */

import dotenv from "dotenv";
import winston from "winston";

/** Provides "base" logger for other classes. */
class Logger {
  private logger: winston.Logger;

  /**
   * Sets options for base logger.
   * @param label - Label for the logger.
   */
  constructor(label: string) {
    // Used to check NODE_ENV.
    dotenv.config({ path: ".env" });
    this.logger = winston.createLogger({
      levels: winston.config.syslog.levels,
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transports: [new winston.transports.File({ filename: "combined.log" })],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: label }),
        winston.format.printf(({ timestamp, label, level, message }) => {
          return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
        })
      ),
    });
  }

  /**
   * Logs a message with level "debug".
   * @param message - The message.
   */
  debug(message: string): void {
    this.logger.debug(message);
  }

  /**
   * Logs a message with level "info".
   * @param message - The message.
   */
  info(message: string): void {
    this.logger.info(message);
  }

  /**
   * Logs a message with level "warning".
   * @param message - The message.
   */
  warning(message: string): void {
    this.logger.warning(message);
  }

  /**
   * Logs a message with level "error".
   * @param message - The message.
   */
  error(message: string): void {
    this.logger.error(message);
  }
}

export { Logger };
