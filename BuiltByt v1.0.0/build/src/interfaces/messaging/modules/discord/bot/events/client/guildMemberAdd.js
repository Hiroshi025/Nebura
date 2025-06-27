"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="d870488e-21ca-509e-b654-6eb14a66c844")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const captcha_canvas_1 = require("captcha-canvas");
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
exports.default = new builders_1.Event("guildMemberAdd", async (member) => {
    const { guild, id } = member;
    if (!guild)
        return;
    const messages = {
        success: `${main_1.client.getEmoji(member.guild.id, "correct")} Thanks for joining **${guild.name}**! You have now gained access to the server.`,
        failed: `${main_1.client.getEmoji(member.guild.id, "error")} Oh no! You failed the verification stage. Please try again.`,
        timedout: `${main_1.client.getEmoji(member.guild.id, "error")}Oh no! You failed! Next time, be a little faster.`,
        wrongCode: `${main_1.client.getEmoji(member.guild.id, "error")}Oh no! You sent me the wrong captcha. Please try again.`,
        dmDisabled: `${main_1.client.getEmoji(member.guild.id, "error")}Oh no! Your DMs are disabled.`,
        roleInvalid: `${main_1.client.getEmoji(member.guild.id, "error")} Oh no! I couldn't find the verification role. Please contact a staff member.`,
        description: `Please type the captcha below to be able to access **${guild.name}**.`,
        notes: [
            `1. Type out the traced colored characters from left to right.`,
            `2. Ignore the decoy characters spread-around.`,
            `3. You don't have to respect characters cases (upper/lower case)!`,
        ].join("\n"),
    };
    const settings = await main_1.main.prisma.myGuild.findFirst({
        where: { guildId: guild.id },
        select: { captcha: true },
    });
    if (!settings)
        return;
    if (!settings.captcha)
        return;
    if (!settings.captcha.isEnabled)
        return;
    if (!member.kickable)
        return;
    if (member.user.bot)
        return;
    const captcha = new captcha_canvas_1.CaptchaGenerator()
        .setDimension(150, 450)
        .setCaptcha({
        size: 60,
        color: "#5865f2",
    })
        .setDecoy({ opacity: 0.5 })
        .setTrace({ color: "#5865f2" });
    const attachment = new discord_js_1.AttachmentBuilder(captcha.generateSync(), {
        name: "captcha.png",
        description: "Captcha verification image.",
    });
    let attempts = 0;
    await member
        .send({
        embeds: [
            new embeds_extend_1.EmbedCorrect()
                .setTitle("Verification Instructions")
                .setDescription(`Welcome to **${guild.name}**! To gain access to the server, you need to complete the captcha verification.\n\n` +
                `**Instructions:**\n` +
                `1. Type the traced colored characters from left to right.\n` +
                `2. Ignore the decoy characters spread around.\n` +
                `3. You don't need to respect character cases (uppercase/lowercase).\n\n` +
                `**Attempts:** You have a maximum of 3 attempts to complete the verification.\n` +
                `**Failed Attempts:** ${attempts}/3`),
        ],
    })
        .catch(() => {
        member.kick(messages.dmDisabled);
    });
    await member
        .send({
        embeds: [
            new embeds_extend_1.EmbedCorrect()
                .setTitle("Verification Captcha")
                .setDescription(messages.description)
                .addFields({ name: `Additional Notes:`, value: messages.notes })
                .setImage(`attachment://captcha.png`),
        ],
        files: [attachment],
    })
        .catch(() => {
        member.kick(messages.dmDisabled);
    });
    const filter = (msg) => msg.author.id === id;
    const collector = member.dmChannel?.createMessageCollector({
        filter,
        time: 120000,
        max: 3,
    });
    collector?.on("collect", async (msg) => {
        attempts++;
        const memberInput = msg.content.toLowerCase();
        if (memberInput === captcha.text?.toLowerCase()) {
            const role = guild.roles.cache.find((r) => r.id === settings.captcha?.role);
            if (role) {
                member.roles.add(role);
                member.send({
                    embeds: [new embeds_extend_1.EmbedCorrect().setDescription(messages.success)],
                });
                if (attempts <= 2) {
                    collector.stop();
                }
            }
            else {
                member.send({
                    embeds: [new embeds_extend_1.EmbedCorrect().setDescription(messages.roleInvalid)],
                });
            }
        }
        else {
            if (attempts >= 3) {
                member.send({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect().setDescription(`${messages.failed} You will be kicked in 1 minute if you do not complete the verification.`),
                    ],
                });
                setTimeout(() => {
                    member.kick(messages.failed);
                }, 60000); // 1 minute
            }
            else {
                member.send({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect()
                            .setTitle("Verification Failed")
                            .setDescription(`You entered the wrong captcha. Please try again.\n\n` + `**Failed Attempts:** ${attempts}/3`),
                    ],
                });
            }
        }
    });
    collector?.on("end", async (_collected, reason) => {
        if (reason === "time") {
            member.kick(messages.failed);
            member.send({
                embeds: [new embeds_extend_1.EmbedCorrect().setDescription(messages.timedout)],
            });
        }
    });
});
//# sourceMappingURL=guildMemberAdd.js.map
//# debugId=d870488e-21ca-509e-b654-6eb14a66c844
