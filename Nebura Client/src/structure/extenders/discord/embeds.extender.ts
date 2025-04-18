import { EmbedBuilder, version as discordVersion } from "discord.js";

import { client } from "@/main";

import { ProyectError } from "../errors.extender";

/**
 * A custom embed class for handling error messages in the application.
 * Extends the `EmbedBuilder` class from Discord.js.
 */
export class ErrorEmbed extends EmbedBuilder {
  /**
   * Tracks the error state of the embed.
   * `true` for success, `false` for error, and `null` for uninitialized.
   */
  private _isError: boolean | null = null; // Propiedad para rastrear el estado de setError

  /**
   * Constructs a new `ErrorEmbed` instance.
   * Automatically sets the footer with response time, Discord.js version, and Node.js version.
   */
  constructor() {
    super();
    const responseTime = Date.now() - client.readyAt!.getTime();
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
    this._isError = status; // Actualiza el estado de error
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
  public setErrorFormat(message: string, details?: string) {
    if (this._isError === false)
      throw new ProyectError("The error format cannot be set if setError is false.");

    const maxFieldLength = 1024; // Discord.js field value limit
    const splitMessage = (text: string) =>
      text.match(new RegExp(`.{1,${maxFieldLength}}`, "g")) || [];

    const fields = [
      {
        name: "Error Project Message",
        value: splitMessage(message).shift() || "No message provided.",
        inline: false,
      },
      ...splitMessage(message)
        .slice(1)
        .map((chunk, index) => ({
          name: `Error Message (Part ${index + 2})`,
          value: chunk,
          inline: false,
        })),
      details
        ? {
            name: "Additional Details",
            value: `\`\`\`\n${splitMessage(details).shift() || "No details provided."}\n\`\`\``,
            inline: false,
          }
        : undefined,
      ...(details
        ? splitMessage(details)
            .slice(1)
            .map((chunk, index) => ({
              name: `Details (Part ${index + 2})`,
              value: `\`\`\n${chunk}\n\`\`\``,
              inline: false,
            }))
        : []),
    ].filter(
      (field): field is { name: string; value: string; inline: false } => field !== undefined,
    );

    this.setFields(...fields);
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
    const responseTime = Date.now() - client.readyAt!.getTime();
    this.setAuthor({
      name: this.truncateText(`Application Nebura AI`, 256),
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
