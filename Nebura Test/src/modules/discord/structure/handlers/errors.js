"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorConsole = ErrorConsole;
const discord_js_1 = require("discord.js");
const util_1 = require("util");
const main_1 = require("../../../../main");
const config_1 = require("../../../../shared/utils/config");
/**
 * Sets up error handling and logging for the Discord client and Node.js process.
 *
 * This function listens for various error events, logs them to the console, and sends detailed
 * error information to a Discord webhook if configured.
 *
 * @param client - The Discord client instance.
 */
async function ErrorConsole(client) {
    // Fetch Discord-specific configuration from the database.
    const data = await main_1.main.prisma.myDiscord.findUnique({
        where: { clientId: config_1.config.modules.discord.clientId },
    });
    // Exit if error logging is disabled or webhook URL is not provided.
    if (!data || data.errorlog === false || data.webhookURL === null)
        return;
    // Initialize a Discord webhook client for sending error logs.
    const webhook = new discord_js_1.WebhookClient({
        url: data.webhookURL,
    });
    // Create a reusable embed template for error messages.
    const embed = new discord_js_1.EmbedBuilder().setColor("Red");
    /**
     * Handles Discord client errors.
     * Logs the error to the console and sends an embed to the configured webhook.
     */
    client.on("error", (err) => {
        console.log(err);
        embed
            .setTitle("Discord API Error")
            .setURL("https://discordjs.guide/popular-topics/errors.html#api-errors")
            .setDescription(`\`\`\`${(0, util_1.inspect)(err, { depth: 0 }).slice(0, 1000)}\`\`\``)
            .setTimestamp();
        webhook.send({ embeds: [embed.toJSON()] }).catch(console.error);
    });
    /**
     * Handles unhandled promise rejections.
     * Logs the rejection reason and promise to the console and sends an embed to the webhook.
     */
    process.on("unhandledRejection", (reason, promise) => {
        console.log(reason, "\n", promise);
        embed
            .setTitle("Unhandled Rejection/Catch")
            .setURL("https://nodejs.org/api/process.html#event-unhandledrejection")
            .addFields({ name: "Reason", value: `\`\`\`${(0, util_1.inspect)(reason, { depth: 0 }).slice(0, 1000)}\`\`\`` }, { name: "Promise", value: `\`\`\`${(0, util_1.inspect)(promise, { depth: 0 }).slice(0, 1000)}\`\`\`` })
            .setTimestamp();
        webhook.send({ embeds: [embed] }).catch(console.error);
    });
    /**
     * Handles uncaught exceptions.
     * Logs the error and origin to the console and sends an embed to the webhook.
     */
    process.on("uncaughtException", (err, origin) => {
        console.log(err, "\n", origin);
        embed
            .setTitle("Uncaught Exception/Catch")
            .setURL("https://nodejs.org/api/process.html#event-uncaughtexception")
            .addFields({ name: "Error", value: `\`\`\`${(0, util_1.inspect)(err, { depth: 0 }).slice(0, 1000)}\`\`\`` }, { name: "Origin", value: `\`\`\`${(0, util_1.inspect)(origin, { depth: 0 }).slice(0, 1000)}\`\`\`` })
            .setTimestamp();
        webhook.send({ embeds: [embed] }).catch(console.error);
    });
    /**
     * Monitors uncaught exceptions.
     * Logs the error and origin to the console and sends an embed to the webhook.
     */
    process.on("uncaughtExceptionMonitor", (err, origin) => {
        console.log(err, "\n", origin);
        embed
            .setTitle("Uncaught Exception Monitor")
            .setURL("https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor")
            .addFields({ name: "Error", value: `\`\`\`${(0, util_1.inspect)(err, { depth: 0 }).slice(0, 1000)}\`\`\`` }, { name: "Origin", value: `\`\`\`${(0, util_1.inspect)(origin, { depth: 0 }).slice(0, 1000)}\`\`\`` })
            .setTimestamp();
        webhook.send({ embeds: [embed] }).catch(console.error);
    });
    /**
     * Handles process warnings.
     * Logs the warning to the console and sends an embed to the webhook.
     */
    process.on("warning", (warn) => {
        console.log(warn);
        embed
            .setTitle("Uncaught Exception Monitor Warning")
            .setURL("https://nodejs.org/api/process.html#event-warning")
            .addFields({
            name: "Warning",
            value: `\`\`\`${(0, util_1.inspect)(warn.message, { depth: 0 }).slice(0, 1000)}\`\`\``,
        })
            .setTimestamp();
        webhook.send({ embeds: [embed] }).catch(console.error);
    });
}
