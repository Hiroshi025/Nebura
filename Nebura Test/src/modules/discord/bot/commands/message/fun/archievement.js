"use strict";
const discord_js_1 = require("discord.js");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const canvas_1 = require("@napi-rs/canvas");
const achievementCommand = {
    name: "achievement",
    description: "The command to create an achievement image.",
    examples: ["achievement I made a new achievement!"],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: [
        "ach",
        "achieve",
        "achv",
        "achvmnt",
        "achievemnt",
        "achievement-get",
        "achievement-getter",
    ],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const text = args.join(" ");
        if (!text)
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} You need to provide a text to generate an achievement image!`,
                        `**Usage:** \`${prefix}achievement <text>\``,
                    ].join("\n"))
                        .setColor("Red"),
                ],
            });
        const background = await (0, canvas_1.loadImage)("./assets/images/achievement.png");
        const canvas = (0, canvas_1.createCanvas)(background.width, background.height);
        const context = canvas.getContext("2d");
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        context.translate(120, 60);
        context.font = "24px Arial";
        context.fillStyle = "#c2c2c2";
        context.fillText(text, 10, 22, 330);
        const file = new discord_js_1.AttachmentBuilder(canvas.toBuffer("image/png"), {
            name: "achievement.png",
        });
        const embed = new embeds_extender_1.EmbedCorrect()
            .setImage("attachment://achievement.png")
            .setColor("Random")
            .setTitle("PH Comment - Image")
            .setTimestamp();
        await message.delete();
        return await message.channel.send({ embeds: [embed], files: [file] });
    },
};
module.exports = achievementCommand;
