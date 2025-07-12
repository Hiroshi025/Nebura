import { ApplicationIntegrationType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";

export default new Command(
  new SlashCommandBuilder()
    .setName("verification")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setNameLocalizations({
      "es-ES": "verificacion",
    })
    .setDescription("🧶 Manage the verification module")
    .setDescriptionLocalizations({
      "es-ES": "🧶 Administra el módulo de verificación",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("configure")
        .setNameLocalizations({
          "es-ES": "configurar",
        })
        .setDescription("🧶 Configure the verification module")
        .setDescriptionLocalizations({
          "es-ES": "🧶 Configura el módulo de verificación",
        })
        .addBooleanOption((options) =>
          options
            .setName("enable")
            .setNameLocalizations({
              "es-ES": "activar",
            })
            .setDescription("🧶 Enable or disable the verification system")
            .setDescriptionLocalizations({
              "es-ES": "🧶 Habilita o deshabilita el sistema de verificación",
            })
            .setRequired(true),
        )
        .addRoleOption((options) =>
          options
            .setName("role")
            .setNameLocalizations({
              "es-ES": "rol",
            })
            .setDescription("🧶 Choose a role to give to verifiers")
            .setDescriptionLocalizations({
              "es-ES": "🧶 Elige un rol para dar a los verificadores",
            })
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("delete").setDescription("🧶 Delete the verification data.")),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member || !client.user) return;
    // Multilenguaje
    const userLang = interaction.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = client.translations.getFixedT(lang, "discord");

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "configure":
        {
          const { options, guild } = interaction;
          const isVerificationEnabled = options.getBoolean("enable") ?? false;
          const verificationdRole = options.getRole("role")?.id ?? "";
          const guildId = guild?.id ?? "";

          try {
            const settings = await main.prisma.myGuild.findUnique({
              where: { id: guildId },
              select: { id: true, captcha: true },
            });
            if (settings) {
              await main.prisma.captcha.update({
                where: { id: guildId },
                data: { isEnabled: isVerificationEnabled, role: verificationdRole },
              });
            } else {
              await main.prisma.myGuild.create({
                data: {
                  guildId: guildId,
                  discordId: client.user.id,
                  captcha: {
                    create: {
                      isEnabled: isVerificationEnabled,
                      role: verificationdRole,
                    },
                  },
                },
              });
            }

            interaction.reply({
              embeds: [
                new EmbedCorrect().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, isVerificationEnabled ? "correct" : "error")} ${t("verification.updated")}`,
                    `**${t("verification.enabled")}:** ${isVerificationEnabled ? t("common.yes") : t("common.no")}`,
                  ].join("\n"),
                ),
              ],
              flags: "Ephemeral",
            });
          } catch (error: any) {
            console.log(error);
            interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} ${t("verification.updateError")}`,
                    `**${t("verification.error")}:** ${error.message}`,
                  ].join("\n"),
                ),
              ],
              flags: "Ephemeral",
            });
          }
        }
        break;
      case "delete":
        {
          const guildId = interaction.guild.id;

          try {
            await main.prisma.captcha.deleteMany({
              where: { guild: { id: guildId } },
            });

            await main.prisma.myGuild.delete({
              where: { id: guildId },
            });

            interaction.reply({
              embeds: [
                new EmbedCorrect().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "correct")} ${t("verification.deleted")}`,
                    `**${t("verification.guild")}:** ${interaction.guild.name} (\`${interaction.guild.id}\`)`,
                  ].join("\n"),
                ),
              ],
              flags: "Ephemeral",
            });
          } catch (error: any) {
            interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} ${t("verification.deleteError")}`,
                    `**${t("verification.error")}:** ${error.message}`,
                  ].join("\n"),
                ),
              ],
              flags: "Ephemeral",
            });
          }
        }
        break;
    }
  },
);
