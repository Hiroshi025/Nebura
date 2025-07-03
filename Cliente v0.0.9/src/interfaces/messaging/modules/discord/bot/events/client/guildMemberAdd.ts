import { CaptchaGenerator } from "captcha-canvas";
import { AttachmentBuilder, Message } from "discord.js";

import { Event } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

export default new Event("guildMemberAdd", async (member) => {
  const { guild, id } = member;
  if (!guild) return;

  // Obtener idioma preferido del usuario o usar "es-ES" por defecto
  const userLang = member.guild.preferredLocale || "es-ES";
  const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
  const t = client.translations.getFixedT(lang, "discord");

  const messages = {
    success: `${client.getEmoji(member.guild.id, "correct")} ${t("captcha.success", { guild: guild.name })}`,
    failed: `${client.getEmoji(member.guild.id, "error")} ${t("captcha.failed")}`,
    timedout: `${client.getEmoji(member.guild.id, "error")} ${t("captcha.timedout")}`,
    wrongCode: `${client.getEmoji(member.guild.id, "error")} ${t("captcha.wrongCode")}`,
    dmDisabled: `${client.getEmoji(member.guild.id, "error")} ${t("captcha.dmDisabled")}`,
    roleInvalid: `${client.getEmoji(member.guild.id, "error")} ${t("captcha.roleInvalid")}`,
    description: t("captcha.description", { guild: guild.name }),
    notes: t("captcha.notes"),
  };

  const settings = await main.prisma.myGuild.findFirst({
    where: { guildId: guild.id },
    select: { captcha: true },
  });

  if (!settings) return;
  if (!settings.captcha) return;
  if (!settings.captcha.isEnabled) return;
  if (!member.kickable) return;
  if (member.user.bot) return;

  const captcha = new CaptchaGenerator()
    .setDimension(150, 450)
    .setCaptcha({
      size: 60,
      color: "#5865f2",
    })
    .setDecoy({ opacity: 0.5 })
    .setTrace({ color: "#5865f2" });
  const attachment = new AttachmentBuilder(captcha.generateSync(), {
    name: "captcha.png",
    description: "Captcha verification image.",
  });

  let attempts = 0;

  await member
    .send({
      embeds: [
        new EmbedCorrect()
          .setTitle(t("captcha.instructionsTitle"))
          .setDescription(
            t("captcha.instructions", {
              guild: guild.name,
              attempts: attempts,
              maxAttempts: 3,
            }),
          ),
      ],
    })
    .catch(() => {
      member.kick(messages.dmDisabled);
    });

  await member
    .send({
      embeds: [
        new EmbedCorrect()
          .setTitle(t("captcha.captchaTitle"))
          .setDescription(messages.description)
          .addFields({ name: t("captcha.additionalNotes"), value: messages.notes })
          .setImage(`attachment://captcha.png`),
      ],
      files: [attachment],
    })
    .catch(() => {
      member.kick(messages.dmDisabled);
    });

  const filter = (msg: Message) => msg.author.id === id;
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
          embeds: [new EmbedCorrect().setDescription(messages.success)],
        });
        if (attempts <= 2) {
          collector.stop();
        }
      } else {
        member.send({
          embeds: [new EmbedCorrect().setDescription(messages.roleInvalid)],
        });
      }
    } else {
      if (attempts >= 3) {
        member.send({
          embeds: [
            new EmbedCorrect().setDescription(
              `${messages.failed} ${t("captcha.kickWarning")}`,
            ),
          ],
        });
        setTimeout(() => {
          member.kick(messages.failed);
        }, 60000); // 1 minuto
      } else {
        member.send({
          embeds: [
            new EmbedCorrect()
              .setTitle(t("captcha.failedTitle"))
              .setDescription(
                t("captcha.failedDescription", { attempts, maxAttempts: 3 }),
              ),
          ],
        });
      }
    }
  });

  collector?.on("end", async (_collected, reason) => {
    if (reason === "time") {
      member.kick(messages.failed);
      member.send({
        embeds: [new EmbedCorrect().setDescription(messages.timedout)],
      });
    }
  });
});
