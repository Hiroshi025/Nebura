"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedCorrect = exports.ErrorEmbed = void 0;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../main");
/**
 * A custom embed class for handling error messages in the application.
 * Extends the `EmbedBuilder` class from Discord.js.
 */
class ErrorEmbed extends discord_js_1.EmbedBuilder {
    /**
     * Constructs a new `ErrorEmbed` instance.
     * Automatically sets the footer with response time, Discord.js version, and Node.js version.
     */
    constructor() {
        super();
        const responseTime = Date.now() - main_1.client.readyAt.getTime();
        this.setFooter({
            text: this.truncateText(`Response: ${responseTime}ms | Discord.js: ${discord_js_1.version} | Node.js: ${process.versions.node}`, 2048),
        });
        this.setTimestamp();
    }
    /**
     * Formats a given date into `DD/MM/YYYY` format.
     * @param date - The date to format.
     * @returns A string representing the formatted date.
     */
    formatDate(date) {
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
    truncateText(text, maxLength) {
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
    setError(status) {
        const formattedDate = this.formatDate(new Date());
        this.setAuthor({
            name: this.truncateText(status ? `Application Success - ${formattedDate}` : `Application Error - ${formattedDate}`, 256),
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
    setErrorFormat(message, details) {
        const maxFieldLength = 1024;
        const fields = [
            {
                name: this.truncateText("Error", 256),
                value: this.truncateText([
                    `> **Message:** ${message}`,
                    `> **Date:** ${this.formatDate(new Date())}`,
                    `> **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
                    `> **User:** <@${main_1.client.user?.id}>`,
                    `> **ID:** ${main_1.client.user?.id}`,
                ].join("\n"), 1024),
            },
        ];
        if (details) {
            fields.push({
                name: this.truncateText("Details", 256),
                value: (0, discord_js_1.codeBlock)("js", this.truncateText(details, maxFieldLength - 11)),
            });
        }
        else {
            fields.push({
                name: this.truncateText("Details", 256),
                value: (0, discord_js_1.codeBlock)("js", "No details provided."),
            });
        }
        this.addFields(fields.map((field) => ({
            name: field.name,
            value: field.value,
            inline: false,
        })));
        return this;
    }
}
exports.ErrorEmbed = ErrorEmbed;
/**
 * A custom embed class for general success messages in the application.
 * Extends the `EmbedBuilder` class from Discord.js.
 */
class EmbedCorrect extends discord_js_1.EmbedBuilder {
    /**
     * Constructs a new `EmbedCorrect` instance.
     * Automatically sets the author, footer, and color for success messages.
     */
    constructor() {
        super();
        const responseTime = Date.now() - main_1.client.readyAt.getTime();
        this.setAuthor({
            name: this.truncateText(`Application Nebura AI`, 256),
            iconURL: main_1.client.user?.avatarURL({ forceStatic: true }),
        });
        this.setFooter({
            text: this.truncateText(`Response: ${responseTime}ms | Discord.js: ${discord_js_1.version} | Node.js: ${process.versions.node}`, 2048),
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
    truncateText(text, maxLength) {
        return text.length > maxLength
            ? `${text.slice(0, maxLength - 15)}...(más ${text.length - maxLength} caracteres)`
            : text;
    }
}
exports.EmbedCorrect = EmbedCorrect;
