"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const util_1 = require("util");
const console_1 = require("../../../../../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../../../../../config/json/emojis.json"));
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const EvalCommand = {
    name: "eval",
    description: "Evaluates a JavaScript code",
    examples: ["eval 1 + 1"],
    nsfw: false,
    owner: true,
    permissions: ["SendMessages"],
    cooldown: 10,
    aliases: ["e"],
    botpermissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        if (!message.guild ||
            !message.channel ||
            message.channel.type !== discord_js_1.ChannelType.GuildText ||
            client.user?.id === message.author.id)
            return undefined;
        const code = args.join(" ");
        if (!code)
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setError(true)
                        .setTitle("❌ Error: Missing Code")
                        .setDescription([
                        `${emojis_json_1.default.error} **No code was provided for evaluation.**`,
                        `> **Correct Usage:** \`${prefix}eval <code>\``,
                    ].join("\n")),
                ],
            });
        try {
            const start = process.hrtime();
            const evaluated = await eval(code);
            const stop = process.hrtime(start);
            let output = (0, util_1.inspect)(evaluated, { depth: 0 });
            let attachment;
            let downloadButton;
            if (output.length > 1000) {
                const fileName = `eval_output_${Date.now()}.txt`;
                attachment = new discord_js_1.AttachmentBuilder(Buffer.from(output), {
                    name: fileName,
                });
                output = `The result is too long. Check the attached file or use the button below to download it.`;
                downloadButton = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setLabel("Download Result")
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setCustomId(`download_${message.author.id}_${fileName}`));
            }
            const executionTimeMs = (stop[0] * 1e9 + stop[1]) / 1e6;
            const executionTimeSec = `${stop[0]}.${Math.floor(stop[1] / 1e6)}s`;
            const response = new embeds_extender_1.EmbedCorrect().setTitle("✅ Evaluation Successful").addFields({
                name: "📥 **Input Code**",
                value: (0, discord_js_1.codeBlock)("js", code),
            }, {
                name: "📤 **Result**",
                value: (0, discord_js_1.codeBlock)("js", output),
            }, {
                name: "⏱️ **Execution Time**",
                value: `**Milliseconds:** \`${executionTimeMs.toFixed(3)}ms\`\n**Seconds:** \`${executionTimeSec}\``,
                inline: true,
            }, {
                name: "📄 **Result Type**",
                value: `\`${typeof evaluated}\``,
                inline: true,
            }, {
                name: "👤 **Executed By**",
                value: `<@${message.author.id}>`,
                inline: true,
            }, {
                name: "📍 **Executed In**",
                value: `**Channel:** <#${message.channel.id}>\n**Guild:** \`${message.guild.name}\``,
                inline: true,
            });
            return message.channel.send({
                embeds: [response],
                files: attachment ? [attachment] : [],
                components: downloadButton ? [downloadButton] : [],
            });
        }
        catch (e) {
            (0, console_1.logWithLabel)("error", `Error in eval command: ${e}`);
            console.error(e);
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setError(true)
                        .setTitle("❌ Evaluation Error")
                        .setDescription([
                        `${emojis_json_1.default.error} **An error occurred while evaluating the code.**`,
                        `> **Correct Usage:** \`${prefix}eval <code>\``,
                    ].join("\n"))
                        .addFields({
                        name: "⚠️ **Error Message**",
                        value: (0, discord_js_1.codeBlock)("js", e.message || "Unknown error"),
                    }, {
                        name: "📚 **Stack Trace**",
                        value: (0, discord_js_1.codeBlock)("js", e.stack || "Not available"),
                    }),
                ],
            });
        }
    },
};
module.exports = EvalCommand;
