"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="2d830c3b-e211-5c74-a5aa-9be4496550c7")}catch(e){}}();

const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const canvas_1 = require("@napi-rs/canvas");
const fbiCommand = {
    name: "fbi",
    description: "Generate an FBI achievement image with the provided text.",
    examples: ["fbi <text>"],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: ["fbihere"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const text = args.join(" ");
        if (!text)
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        `${client.getEmoji(message.guild.id, "error")} You need to provide text to be displayed on the image!`,
                        `**Usage:** \`${prefix}fbi <text>\``,
                    ].join("\n")),
                ],
            });
        const background = await (0, canvas_1.loadImage)("./assets/images/why-fbi-here.png");
        const overlay = await (0, canvas_1.loadImage)("./assets/images/why-fbi-here-overlay.png");
        const canvas = (0, canvas_1.createCanvas)(background.width, background.height);
        const context = canvas.getContext("2d");
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        context.font = "30px Arial";
        context.fillText(text, 40, 290);
        context.drawImage(overlay, 627, 0, overlay.width, overlay.height);
        const file = new discord_js_1.AttachmentBuilder(canvas.toBuffer("image/png"), {
            name: "why-fbi-here.png",
        });
        const embed = new embeds_extend_1.EmbedCorrect()
            .setImage("attachment://why-fbi-here.png")
            .setColor("Random")
            .setTitle("PH Comment - Image")
            .setTimestamp();
        await message.delete();
        return await message.channel.send({ embeds: [embed], files: [file] });
    },
};
module.exports = fbiCommand;
//# sourceMappingURL=fbi.js.map
//# debugId=2d830c3b-e211-5c74-a5aa-9be4496550c7
