"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9bfb7e49-bded-589a-bc14-58c3fb53baf5")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const eternal_support_1 = require("eternal-support");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const emojis_json_1 = __importDefault(require("../../../../../../../../../config/json/emojis.json"));
const console_1 = require("../../../../../../../../shared/utils/functions/console");
async function animeApi(action) {
    try {
        const res = await axios_1.default.get(`https://api.waifu.pics/sfw/${action}`);
        return res.data.url;
    }
    catch (err) {
        (0, console_1.logWithLabel)("error", `Error in animeApi: ${err}`);
    }
}
const emotionsCommand = {
    name: "reactions",
    description: "Get a list of emotions",
    examples: [
        "emotions baka",
        "emotions eightball",
        "emotions slap",
        "emotions kiss",
        `anime alert [text]`,
        `anime biden [text]`,
        `anime cringe`,
        `anime facts [text]`,
        `anime handhold [user]`,
        `anime waifu`,
    ],
    subcommands: [
        "emotions baka [user]: Baka someone",
        "emotions eightball [text]: 8Ball",
        "emotions slap [user]: Slap someone",
        "emotions kiss [user]: Kiss someone",
        "emotions tickle [user]: Tickle someone",
        "anime alert [text]",
        "anime biden [text]",
        "anime cringe",
        "anime facts [text]",
        "anime handhold [user]",
        "anime waifu",
    ],
    nsfw: false,
    owner: false,
    cooldown: 2,
    aliases: ["emoticons"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const nekoclient = new eternal_support_1.NekoClient();
        const subcommand = args[0];
        switch (subcommand) {
            case "eightball":
                {
                    const text = args.join(" ");
                    if (!text)
                        return message.channel.send({
                            embeds: [
                                new embeds_extend_1.ErrorEmbed().setDescription([
                                    `${emojis_json_1.default.error} **${message.author.username}**, You need to provide a text!`,
                                    `> **Usage:** \`${prefix}8ball [text]\``,
                                ].join("\n")),
                            ],
                        });
                    await nekoclient.eightBall({ text: text }).then((result) => {
                        const embed = new discord_js_1.EmbedBuilder()
                            .setTitle(`8Ball ${message.author.username}`)
                            .setColor("Random")
                            .setFooter({
                            text: `Requested by ${message.author.username}`,
                            iconURL: message.author.displayAvatarURL(),
                        })
                            .setDescription(result.response)
                            .setImage(result.url);
                        message.channel.send({ embeds: [embed] });
                    });
                }
                break;
            case "slap":
                {
                    try {
                        const user = message.mentions.users.first() || message.author;
                        const embed = new discord_js_1.EmbedBuilder()
                            .setTitle("Emotions Commands")
                            .setDescription(`${message.author} A slapped *${user}* hard`)
                            .setImage((await nekoclient.slap()).url);
                        message.channel.send({ embeds: [embed] });
                    }
                    catch (error) {
                        (0, console_1.logWithLabel)("error", `Error in slap: ${error}`);
                        message.channel.send({
                            embeds: [
                                new embeds_extend_1.ErrorEmbed().setDescription([
                                    `${emojis_json_1.default.error} **${message.author.username}**, You need to provide a text!`,
                                    `> **Usage:** \`${prefix}slap [text]\``,
                                ].join("\n")),
                            ],
                        });
                    }
                }
                break;
            case "kiss":
                {
                    try {
                        const user = message.mentions.users.first() || message.author;
                        const embed = new discord_js_1.EmbedBuilder()
                            .setTitle("Emotions Commands")
                            .setDescription(`${message.author} A kissed *${user}*`)
                            .setImage((await nekoclient.kiss()).url);
                        message.channel.send({ embeds: [embed] });
                    }
                    catch (error) {
                        (0, console_1.logWithLabel)("error", `Error in kiss: ${error}`);
                        message.channel.send({
                            content: [
                                `${emojis_json_1.default.error} **${message.author.username}**, You need to provide a text!`,
                                `> **Usage:** \`${prefix}kiss [text]\``,
                            ].join("\n"),
                        });
                    }
                }
                break;
            case "tickle":
                {
                    try {
                        const user = message.mentions.users.first() || message.author;
                        const embed = new discord_js_1.EmbedBuilder()
                            .setTitle("Emotions Commands")
                            .setDescription(`${message.author} He is tickling *${user}*`)
                            .setImage((await nekoclient.kiss()).url);
                        message.channel.send({ embeds: [embed] });
                    }
                    catch (error) {
                        (0, console_1.logWithLabel)("error", `Error in tickle: ${error}`);
                        message.channel.send({
                            content: [
                                `${emojis_json_1.default.error} **${message.author.username}**, You need to provide a text!`,
                                `> **Usage:** \`${prefix}tickle [text]\``,
                            ].join("\n"),
                        });
                    }
                }
                break;
            case "alert":
                {
                    const texto = args.slice(1).join(" ");
                    if (!texto)
                        return message.channel.send([
                            `${emojis_json_1.default.error} You must enter a text to generate the image`,
                            `Example: \`${prefix}anime alert Hello World\``,
                        ].join("\n"));
                    const attachment = new discord_js_1.AttachmentBuilder(`https://api.popcat.xyz/alert?text=${encodeURIComponent(texto)}`, {
                        name: "image.png",
                    });
                    message.channel.send({ files: [attachment] }).catch(() => {
                        message.reply({
                            content: [
                                ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                `plase report this error to the support server.`,
                            ].join("\n"),
                        });
                    });
                }
                break;
            case "biden":
                {
                    const texto = args.slice(1).join(" ");
                    if (!texto)
                        return message.reply([
                            `${emojis_json_1.default.error} You must enter a text to generate the image`,
                            `Example: \`${prefix}anime biden Hello World\``,
                        ].join("\n"));
                    const attachment = new discord_js_1.AttachmentBuilder(`https://api.popcat.xyz/biden?text=${encodeURIComponent(texto)}`, {
                        name: "image.png",
                    });
                    message.channel.send({ files: [attachment] }).catch(() => {
                        message.reply({
                            content: [
                                ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                `plase report this error to the support server.`,
                            ].join("\n"),
                        });
                    });
                }
                break;
            case "cringe":
                {
                    const data = await animeApi("cringe");
                    const prettyCringe = new discord_js_1.EmbedBuilder()
                        .setColor("Grey")
                        .setAuthor({
                        name: `${message.author.username} thinks that's pretty embarrassing.`,
                        iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
                    })
                        .setImage(data)
                        .setTimestamp();
                    message.reply({ embeds: [prettyCringe] }).catch(() => {
                        message.reply({
                            content: [
                                ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                `plase report this error to the support server.`,
                            ].join("\n"),
                        });
                    });
                }
                break;
            case "facts":
                {
                    const texto = args.slice(1).join(" ");
                    if (texto)
                        return message.reply([
                            `${emojis_json_1.default.error} You must enter a text to generate the image`,
                            `Example: \`${prefix}anime facts Hello World\``,
                        ].join("\n"));
                    const attachment = new discord_js_1.AttachmentBuilder(`https://api.popcat.xyz/facts?text=${encodeURIComponent(texto)}`, {
                        name: "image.png",
                    });
                    message.channel.send({ files: [attachment] }).catch(() => {
                        message.reply({
                            content: [
                                ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                `plase report this error to the support server.`,
                            ].join("\n"),
                        });
                    });
                }
                break;
            case "handhold":
                {
                    const data = await animeApi("handhold");
                    const user = message.mentions.users.first();
                    if (!user)
                        return message.channel.send([
                            `${emojis_json_1.default.error} You must mention a user to interact with.`,
                            `Example: \`${prefix}anime handhold @user\``,
                        ].join("\n"));
                    if (user.id === message.author.id)
                        return message.channel.send([`${emojis_json_1.default.error} You can't interact with yourself.`, `Example: \`${prefix}anime handhold @user\``].join("\n"));
                    if (user.id === client.user?.id)
                        return message.channel.send([
                            `${emojis_json_1.default.error} You can't interact with me that's too sad.`,
                            `Example: \`${prefix}anime handhold @user\``,
                        ].join("\n"));
                    if (user.bot)
                        return message.channel.send([`${emojis_json_1.default.error} You can't interact with bots.`, `Example: \`${prefix}anime handhold @user\``].join("\n"));
                    const lonerhld = new discord_js_1.EmbedBuilder()
                        .setColor("Grey")
                        .setAuthor({
                        name: `${message.author.username} is holding hands with ${client.user?.username}!`,
                        iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
                    })
                        .setImage(data)
                        .setTimestamp();
                    if (user.id === message.author.id)
                        return message.reply({ embeds: [lonerhld] }).catch(() => {
                            message.reply({
                                content: [
                                    ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                    `plase report this error to the support server.`,
                                ].join("\n"),
                            });
                        });
                    const handholdEmbed = new discord_js_1.EmbedBuilder()
                        .setColor("Grey")
                        .setAuthor({
                        name: `${message.author.username} is holding hands with ${user.username}!`,
                        iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
                    })
                        .setImage(data)
                        .setTimestamp();
                    message.reply({ embeds: [handholdEmbed] }).catch(() => {
                        message.reply({
                            content: [
                                ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                `plase report this error to the support server.`,
                            ].join("\n"),
                        });
                    });
                }
                break;
            case "waifu":
                {
                    const data = await animeApi("waifu");
                    const prettyCringe = new discord_js_1.EmbedBuilder()
                        .setColor("Grey")
                        .setAuthor({
                        name: `${message.author.username} here is a cute waifu with you`,
                        iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
                    })
                        .setImage(data)
                        .setTimestamp();
                    message.reply({ embeds: [prettyCringe] }).catch(() => {
                        message.reply({
                            content: [
                                ` ${emojis_json_1.default.error} An error occurred while executing the command, try again later`,
                                `plase report this error to the support server.`,
                            ].join("\n"),
                        });
                    });
                }
                break;
        }
    },
};
module.exports = emotionsCommand;
//# sourceMappingURL=reactions.js.map
//# debugId=9bfb7e49-bded-589a-bc14-58c3fb53baf5
