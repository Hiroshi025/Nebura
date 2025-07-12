import {
	ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ButtonStyle,
	ChatInputCommandInteraction, ModalBuilder, PermissionFlagsBits, SlashCommandBuilder,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { MyDiscord } from "@messaging/modules/discord/client";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";

export default new Command(
  new SlashCommandBuilder()
    .setName("review")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setNameLocalizations({
      "es-ES": "reseñas",
    })
    .setDescription("Manage reviews in this server")
    .setDescriptionLocalizations({
      "es-ES": "Gestionar reseñas en este servidor",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setNameLocalizations({
          "es-ES": "configurar-sistema",
        })
        .setDescription("Set up the review system for this server")
        .setDescriptionLocalizations({
          "es-ES": "Configurar el sistema de reseñas para este servidor",
        }),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setNameLocalizations({
          "es-ES": "crear",
        })
        .setDescription("Create a new review")
        .setDescriptionLocalizations({
          "es-ES": "Crear una nueva reseña",
        })
        .addUserOption((option) =>
          option
            .setName("target")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("The user you're reviewing")
            .setDescriptionLocalizations({
              "es-ES": "El usuario que estás reseñando",
            })
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setNameLocalizations({
          "es-ES": "editar",
        })
        .setDescription("Edit one of your reviews")
        .setDescriptionLocalizations({
          "es-ES": "Editar una de tus reseñas",
        })
        .addStringOption((option) =>
          option
            .setName("id")
            .setNameLocalizations({
              "es-ES": "id",
            })
            .setDescription("The ID of the review to edit")
            .setDescriptionLocalizations({
              "es-ES": "El ID de la reseña a editar",
            })
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setNameLocalizations({
          "es-ES": "info",
        })
        .setDescription("Get information about a review")
        .setDescriptionLocalizations({
          "es-ES": "Obtener información sobre una reseña",
        })
        .addStringOption((option) =>
          option
            .setName("id")
            .setNameLocalizations({
              "es-ES": "id",
            })
            .setDescription("The ID of the review to view")
            .setDescriptionLocalizations({
              "es-ES": "El ID de la reseña a ver",
            })
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete-system")
        .setNameLocalizations({
          "es-ES": "eliminar-sistema",
        })
        .setDescription("Delete the entire review system (Admin only)")
        .setDescriptionLocalizations({
          "es-ES": "Eliminar todo el sistema de reseñas (Solo administradores)",
        }),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("config")
        .setNameLocalizations({
          "es-ES": "configurar-ajustes",
        })
        .setDescription("Configure review settings")
        .setDescriptionLocalizations({
          "es-ES": "Configurar ajustes de reseñas",
        }),
    ),
  async (client, interaction) => {
    if (!interaction.guild) {
      return interaction.reply({
        embeds: [new ErrorEmbed().setDescription("This command can only be used in a server.")],
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const { guild } = interaction;

    // Get language preference
    const lang =
      (await (await import("@/main")).main.prisma.myGuild.findUnique({ where: { guildId: guild.id } }))?.lenguage ||
      interaction.locale ||
      "es-ES";
    const t = (key: string, options?: any) => client.translations.t("discord:" + key, { lng: lang, ...options });

    try {
      switch (subcommand) {
        case "setup":
          await handleSetup(client, interaction, t);
          break;
        case "create":
          await handleCreate(client, interaction, t);
          break;
        case "edit":
          await handleEdit(client, interaction, t);
          break;
        case "info":
          await handleInfo(client, interaction, t);
          break;
        case "config":
          await handleConfig(client, interaction, t);
          break;
        case "delete-system":
          await handleDeleteSystem(client, interaction, t);
          break;
        default:
          await interaction.reply({
            embeds: [new ErrorEmbed().setDescription(t("review.errors.unknownCommand"))],
            flags: "Ephemeral",
          });
      }
    } catch (error) {
      console.error("Review command error:", error);
      await interaction.reply({
        embeds: [new ErrorEmbed().setDescription(t("review.errors.generic"))],
        flags: "Ephemeral",
      });
    }

    async function handleDeleteSystem(_client: MyDiscord, interaction: ChatInputCommandInteraction, t: any) {
      if (!interaction.guild || !interaction.member) return;

      // Verificar permisos de administrador
      if (
        typeof interaction.member.permissions !== "string" &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.deleteSystem.adminOnly"))],
          ephemeral: true,
        });
      }

      // Confirmación con botones
      const confirmEmbed = new EmbedCorrect()
        .setTitle(t("review.deleteSystem.confirmTitle"))
        .setDescription(t("review.deleteSystem.confirmDescription"))
        .setColor("#FF0000");

      const confirmButtons: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("confirmDeleteSystem")
          .setLabel(t("common.confirm"))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("cancelDeleteSystem")
          .setLabel(t("common.cancel"))
          .setStyle(ButtonStyle.Secondary),
      );

      const response = await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmButtons],
        ephemeral: true,
      });

      // Colector de interacción
      const collectorFilter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;
      try {
        const confirmation = await response.awaitMessageComponent({
          filter: collectorFilter,
          time: 60_000,
        });

        if (confirmation.customId === "confirmDeleteSystem") {
          // Eliminar todas las reseñas y la configuración
          await main.prisma.$transaction([
            main.prisma.review.deleteMany({
              where: { guildId: interaction.guild.id },
            }),
            main.prisma.reviewConfig.deleteMany({
              where: { guildId: interaction.guild.id },
            }),
          ]);

          await confirmation.update({
            embeds: [new EmbedCorrect().setDescription(t("review.deleteSystem.success"))],
            components: [],
          });
        } else {
          await confirmation.update({
            embeds: [new EmbedCorrect().setDescription(t("review.deleteSystem.cancelled"))],
            components: [],
          });
        }
      } catch (error) {
        console.error("Error in delete system confirmation:", error);
        await interaction.editReply({
          embeds: [new ErrorEmbed().setDescription(t("review.deleteSystem.timeout"))],
          components: [],
        });
      }
      return;
    }

    async function handleSetup(_client: MyDiscord, interaction: ChatInputCommandInteraction, t: any) {
      if (!interaction.guild || !interaction.member) return;
      // Check if user has admin permissions
      const permissions = interaction.member.permissions;
      if (typeof permissions !== "string" && !permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.adminOnly"))],
          flags: "Ephemeral",
        });
      }

      // Check if already set up
      const existingConfig = await main.prisma.reviewConfig.findUnique({
        where: { guildId: interaction.guild.id },
      });

      if (existingConfig) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.setup.alreadySetup"))],
          flags: "Ephemeral",
        });
      }

      // Create modal for setup
      const modal = new ModalBuilder().setCustomId("reviewSetup").setTitle(t("review.setup.title"));

      const channelInput = new TextInputBuilder()
        .setCustomId("channelId")
        .setLabel(t("review.setup.channelLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(t("review.setup.channelPlaceholder"));

      const roleInput = new TextInputBuilder()
        .setCustomId("requiredRoleId")
        .setLabel(t("review.setup.roleLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder(t("review.setup.rolePlaceholder"));

      const minLengthInput = new TextInputBuilder()
        .setCustomId("minReviewLength")
        .setLabel(t("review.setup.minLengthLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue("10")
        .setPlaceholder(t("review.setup.minLengthPlaceholder"));

      const maxLengthInput = new TextInputBuilder()
        .setCustomId("maxReviewLength")
        .setLabel(t("review.setup.maxLengthLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue("500")
        .setPlaceholder(t("review.setup.maxLengthPlaceholder"));

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(roleInput);
      const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(minLengthInput);
      const fourthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(maxLengthInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

      await interaction.showModal(modal);
      return;
    }

    async function handleCreate(_client: MyDiscord, interaction: ChatInputCommandInteraction, t: any) {
      if (!interaction.guild || !interaction.member) return;
      const targetUser = interaction.options.getUser("target");
      const author = interaction.user;
      const guild = interaction.guild;

      if (!targetUser || targetUser.bot) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.noTarget"))],
          flags: "Ephemeral",
        });
      }

      // Check if system is set up
      const config = await main.prisma.reviewConfig.findUnique({
        where: { guildId: guild.id },
      });

      if (!config) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.notSetup"))],
          flags: "Ephemeral",
        });
      }

      // Check role requirement
      if (config.requiredRoleId) {
        const member = await guild.members.fetch(targetUser.id);
        if (!member.roles.cache.has(config.requiredRoleId)) {
          return interaction.reply({
            embeds: [new ErrorEmbed().setDescription(t("review.errors.missingRole"))],
            flags: "Ephemeral",
          });
        }
      }

      // Check cooldown
      const lastReview = await main.prisma.review.findFirst({
        where: {
          guildId: guild.id,
          authorId: author.id,
          createdAt: {
            gt: new Date(Date.now() - config.cooldown * 1000),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (lastReview) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.cooldown", { seconds: config.cooldown }))],
          flags: "Ephemeral",
        });
      }

      // Check if user is trying to review themselves
      if (targetUser.id === author.id) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.selfReview"))],
          flags: "Ephemeral",
        });
      }

      // Create modal for review
      const modal = new ModalBuilder()
        .setCustomId(`reviewCreate_${targetUser.id}`)
        .setTitle(t("review.create.title", { user: targetUser.username }));

      const starsInput = new TextInputBuilder()
        .setCustomId("stars")
        .setLabel(t("review.create.starsLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("1-5");

      const contentInput = new TextInputBuilder()
        .setCustomId("content")
        .setLabel(t("review.create.contentLabel"))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMinLength(config.minReviewLength)
        .setMaxLength(config.maxReviewLength)
        .setPlaceholder(
          t("review.create.contentPlaceholder", { min: config.minReviewLength, max: config.maxReviewLength }),
        );

      const anonymousInput = new TextInputBuilder()
        .setCustomId("anonymous")
        .setLabel(t("review.create.anonymousLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("yes/no");

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(starsInput);
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);
      const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(anonymousInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      await interaction.showModal(modal);
      return;
    }

    async function handleEdit(_client: MyDiscord, interaction: ChatInputCommandInteraction, t: any) {
      if (!interaction.guild || !interaction.member) return;
      const reviewId = interaction.options.getString("id");
      const author = interaction.user;

      if (!reviewId) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.noTarget"))],
          flags: "Ephemeral",
        });
      }

      // Find the review
      const review = await main.prisma.review.findUnique({
        where: {
          customId: reviewId,
          guildId: interaction.guild.id,
        },
      });

      if (!review) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.notFound"))],
          flags: "Ephemeral",
        });
      }

      // Check if user is the author
      if (review.authorId !== author.id) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.notAuthor"))],
          flags: "Ephemeral",
        });
      }

      // Get config for length limits
      const config = await main.prisma.reviewConfig.findUnique({
        where: { guildId: interaction.guild.id },
      });

      if (!config) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.noConfig"))],
          flags: "Ephemeral",
        });
      }

      // Create modal for editing
      const modal = new ModalBuilder()
        .setCustomId(`reviewEdit_${reviewId}`)
        .setTitle(t("review.edit.title", { id: reviewId }));

      const starsInput = new TextInputBuilder()
        .setCustomId("stars")
        .setLabel(t("review.edit.starsLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(review.stars.toString());

      const contentInput = new TextInputBuilder()
        .setCustomId("content")
        .setLabel(t("review.edit.contentLabel"))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(review.content)
        .setMinLength(config.minReviewLength)
        .setMaxLength(config.maxReviewLength);

      const anonymousInput = new TextInputBuilder()
        .setCustomId("anonymous")
        .setLabel(t("review.edit.anonymousLabel"))
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(review.anonymous ? "yes" : "no");

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(starsInput);
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);
      const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(anonymousInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      await interaction.showModal(modal);
      return;
    }

    async function handleInfo(client: MyDiscord, interaction: ChatInputCommandInteraction, t: any) {
      if (!interaction.guild || !interaction.member) return;
      const reviewId = interaction.options.getString("id");

      if (!reviewId) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.noTarget"))],
          flags: "Ephemeral",
        });
      }

      // Find the review
      const review = await main.prisma.review.findUnique({
        where: {
          customId: reviewId,
          guildId: interaction.guild.id,
        },
      });

      if (!review) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.notFound"))],
          flags: "Ephemeral",
        });
      }

      // Get user objects
      const [targetUser, authorUser] = await Promise.all([
        client.users.fetch(review.targetId).catch(() => null),
        review.anonymous ? null : client.users.fetch(review.authorId).catch(() => null),
      ]);

      // Create embed
      const embed = new EmbedCorrect()
        .setTitle(t("review.info.title", { id: reviewId }))
        .setDescription(review.content)
        .addFields([
          {
            name: t("review.info.stars"),
            value: "⭐".repeat(review.stars) + "☆".repeat(5 - review.stars),
            inline: true,
          },
          {
            name: t("review.info.target"),
            value: targetUser ? targetUser.toString() : t("review.info.userLeft"),
            inline: true,
          },
          {
            name: t("review.info.author"),
            value: authorUser ? authorUser.toString() : t("review.info.anonymous"),
            inline: true,
          },
          {
            name: t("review.info.created"),
            value: `<t:${Math.floor(review.createdAt.getTime() / 1000)}:R>`,
            inline: true,
          },
          {
            name: t("review.info.updated"),
            value: `<t:${Math.floor(review.updatedAt.getTime() / 1000)}:R>`,
            inline: true,
          },
        ])
        .setColor("#FFD700")
        .setFooter({
          text: t("review.info.footer", { guild: interaction.guild.name }),
          iconURL: interaction.guild.iconURL() as string,
        });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    async function handleConfig(_client: MyDiscord, interaction: ChatInputCommandInteraction, t: any) {
      if (!interaction.guild || !interaction.member) return;
      // Check if user has admin permissions
      const permissions = interaction.member.permissions;
      if (typeof permissions !== "string" && !permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.adminOnly"))],
          flags: "Ephemeral",
        });
      }

      // Get current config
      const config = await main.prisma.reviewConfig.findUnique({
        where: { guildId: interaction.guild.id },
      });

      if (!config) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.notSetup"))],
          flags: "Ephemeral",
        });
      }

      // Create embed with current config
      const embed = new EmbedCorrect()
        .setTitle(t("review.config.title"))
        .setDescription(t("review.config.description"))
        .addFields([
          { name: t("review.config.channel"), value: `<#${config.channelId}>`, inline: true },
          {
            name: t("review.config.requiredRole"),
            value: config.requiredRoleId ? `<@&${config.requiredRoleId}>` : t("review.config.none"),
            inline: true,
          },
          { name: t("review.config.minLength"), value: config.minReviewLength.toString(), inline: true },
          { name: t("review.config.maxLength"), value: config.maxReviewLength.toString(), inline: true },
          {
            name: t("review.config.allowAnonymous"),
            value: config.allowAnonymous ? t("common.yes") : t("common.no"),
            inline: true,
          },
          { name: t("review.config.cooldown"), value: `${config.cooldown} ${t("common.seconds")}`, inline: true },
        ])
        .setColor("#7289DA");

      // Create select menu for what to edit
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("reviewConfigEdit")
        .setPlaceholder(t("review.config.selectPlaceholder"))
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel(t("review.config.editChannel")).setValue("channel"),
          new StringSelectMenuOptionBuilder().setLabel(t("review.config.editRole")).setValue("role"),
          new StringSelectMenuOptionBuilder().setLabel(t("review.config.editMinLength")).setValue("minLength"),
          new StringSelectMenuOptionBuilder().setLabel(t("review.config.editMaxLength")).setValue("maxLength"),
          new StringSelectMenuOptionBuilder().setLabel(t("review.config.editAnonymous")).setValue("anonymous"),
          new StringSelectMenuOptionBuilder().setLabel(t("review.config.editCooldown")).setValue("cooldown"),
        );

      const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        flags: "Ephemeral",
      });
      return;
    }

    return;
  },
);
