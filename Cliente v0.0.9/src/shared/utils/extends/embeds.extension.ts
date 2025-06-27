import { codeBlock, EmbedBuilder, version as discordVersion } from "discord.js";

import { client } from "@/main";
import { config } from "@utils/config";

/**
 * A custom embed class for handling error messages in the application.
 * Extends the `EmbedBuilder` class from Discord.js.
 */
export class ErrorEmbed extends EmbedBuilder {
  /**
   * Constructs a new `ErrorEmbed` instance.
   * Automatically sets the footer with response time, Discord.js version, and Node.js version.
   */
  constructor() {
    super();
    const time = (Date.now() - client.readyAt!.getTime()) / 1000 / 1000;
    const responseTime = Math.round(time);
    this.setFooter({
      text: this.truncateText(
        `Response: ${responseTime}ms | Discord.js: ${discordVersion} | Node.js: ${process.versions.node}`,
        2048,
      ),
    });
    this.setTimestamp();
  }

  /**
   * Formats a given date into `DD/MM/YYYY` format.
   * @param date - The date to format.
   * @returns A string representing the formatted date.
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Truncates a string if it exceeds the specified maximum length.
   * Adds an indicator showing the number of characters truncated.
   * @param text - The text to truncate.
   * @param maxLength - The maximum allowed length for the text.
   * @returns The truncated text with an indicator if necessary.
   */
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? `${text.slice(0, maxLength - 15)}...(más ${text.length - maxLength} caracteres)`
      : text;
  }

  /**
   * Sets the error state of the embed.
   * Updates the author field and color based on the error state.
   * @param status - `true` for success, `false` for error.
   * @returns The current `ErrorEmbed` instance for chaining.
   */
  public setError(status: boolean) {
    const formattedDate = this.formatDate(new Date());
    this.setAuthor({
      name: this.truncateText(
        status ? `Application Success - ${formattedDate}` : `Application Error - ${formattedDate}`,
        256,
      ),
    });
    this.setColor(status ? 0x00ff00 : 0xff0000);
    return this;
  }

  /**
   * Configures the embed with error details.
   * Throws an error if the embed is not in an error state.
   * @param message - The main error message.
   * @param details - Optional additional details about the error.
   * @returns The current `ErrorEmbed` instance for chaining.
   * @throws `ProyectError` if `setError` was called with `false`.
   */
  public setErrorFormat(details?: string) {
    const maxFieldLength = 1024;
    const fields = [
      {
        name: this.truncateText("Error", 256),
        value: codeBlock(
          "js",
          this.truncateText(details || "An error occurred.", maxFieldLength - 11),
        ),
      },
    ];

    if (details) {
      fields.push({
        name: this.truncateText("Details", 256),
        value: codeBlock("js", this.truncateText(details, maxFieldLength - 11)),
      });
    } else {
      fields.push({
        name: this.truncateText("Details", 256),
        value: codeBlock("js", "No details provided."),
      });
    }

    this.addFields(
      fields.map((field) => ({
        name: field.name,
        value: field.value,
        inline: false,
      })),
    );
    return this;
  }
}

/**
 * A custom embed class for general success messages in the application.
 * Extends the `EmbedBuilder` class from Discord.js.
 */
export class EmbedCorrect extends EmbedBuilder {
  /**
   * Constructs a new `EmbedCorrect` instance.
   * Automatically sets the author, footer, and color for success messages.
   */
  constructor() {
    super();
    const time = (Date.now() - client.readyAt!.getTime()) / 1000 / 1000;
    const responseTime = Math.round(time);
    this.setAuthor({
      name: this.truncateText(config.project.name, 256),
      iconURL: client.user?.avatarURL({ forceStatic: true }) as string,
    });
    this.setFooter({
      text: this.truncateText(
        `Response: ${responseTime}ms | Discord.js: ${discordVersion} | Node.js: ${process.versions.node}`,
        2048,
      ),
    });
    this.setColor("Green");
    this.setTimestamp();
  }

  /**
   * Truncates a string if it exceeds the specified maximum length.
   * Adds an indicator showing the number of characters truncated.
   * @param text - The text to truncate.
   * @param maxLength - The maximum allowed length for the text.
   * @returns The truncated text with an indicator if necessary.
   */
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? `${text.slice(0, maxLength - 15)}...(más ${text.length - maxLength} caracteres)`
      : text;
  }
}
