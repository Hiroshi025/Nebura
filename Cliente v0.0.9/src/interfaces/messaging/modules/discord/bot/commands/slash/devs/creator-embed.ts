import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	SlashCommandBuilder, StringSelectMenuBuilder, TextChannel
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import {
	createButton, disableComponents, enableComponents, getMenuOptions, updateEmbedField
} from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { main } from "@/main";

/**
 * Slash command for creating custom embeds interactively.
 * Allows administrators to build and send embeds to a selected channel using Discord components.
 *
 * @module creator-embed
 */
export default new Command(
  /**
   * Command builder for the embed creator.
   */
  new SlashCommandBuilder()
    .setName("embed-creator")
    .setNameLocalizations({
      "es-ES": "creador-embed",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Create custom embeds")
    .setDescriptionLocalizations({
      "es-ES": "Crea embeds personalizados",
    })
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setNameLocalizations({
          "es-ES": "canal",
        })
        .setDescription("Send the embed to a different channel")
        .setDescriptionLocalizations({
          "es-ES": "Enviar el embed a un canal diferente",
        }),
    ),
  /**
   * Command execution handler.
   * @param _client - The Discord client instance.
   * @param interaction - The command interaction.
   */
  async (client, interaction) => {
    const { options, member } = interaction;
    const channel = options.getChannel("channel") || interaction.channel;

    const data = await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild?.id as string } });
    const t = (key: string, options?: any) => client.translations.t("discord:" + key, { lng: lang, ...options });
    const lang = data?.lenguage || interaction.locale || "es-ES";

    /**
     * Preview embed shown to the user for live editing.
     */
    const previewEmbed = new EmbedBuilder().setDescription(t("creatorEmbed.preview"));
    /**
     * Embed containing the settings and instructions.
     */
    const setupEmbed = new EmbedBuilder()
      .setColor("#7700ff")
      .setTitle(t("creatorEmbed.settingsTitle"))
      .setDescription(t("creatorEmbed.settingsDesc"));

    /**
     * Collection of interactive buttons used in the embed creator.
     */
    const buttons = {
      /** Button to send the embed. */
      send: createButton("@Send", t("creatorEmbed.send"), ButtonStyle.Success),
      /** Button to cancel the embed creation. */
      cancel: createButton("@Cancel", t("creatorEmbed.cancel"), ButtonStyle.Danger),
      /** Button to return from field editing. */
      return: createButton("@fieldReturn", t("creatorEmbed.return"), ButtonStyle.Secondary),
      /** Button to add a field to the embed. */
      addField: createButton("@remField", t("creatorEmbed.add"), ButtonStyle.Success),
      /** Button to remove a field from the embed. */
      removeField: createButton("@addField", t("creatorEmbed.remove"), ButtonStyle.Danger),
    };

    /**
     * Select menu for editing embed properties.
     */
    const menu = new StringSelectMenuBuilder()
      .setCustomId("@Menu")
      .setPlaceholder(t("creatorEmbed.editPreview"))
      .setMaxValues(1)
      .setMinValues(1)
      .setOptions(getMenuOptions());

    /**
     * Action row containing the select menu.
     */
    const setupComponent = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    /**
     * Action row containing the main action buttons.
     */
    const buttonComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.cancel, buttons.send);
    /**
     * Action row for field editing buttons.
     */
    const fieldSetupComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.removeField,
      buttons.addField,
    );
    /**
     * Action row for returning from field editing.
     */
    const fieldMenuComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.return);

    /**
     * Sends the initial reply with the preview and setup embeds and components.
     */
    const replies = await interaction.reply({
      embeds: [previewEmbed, setupEmbed],
      components: [setupComponent, buttonComponent],
    });

    /**
     * Filter for component collectors to only allow the command invoker.
     * @param i - The interaction to filter.
     * @returns True if the user is the command invoker.
     */
    const filter = (i: any) => !!member && i.user.id === member.user.id;
    /**
     * Collector for handling component interactions.
     */
    const collector = replies.createMessageComponentCollector({
      filter,
      idle: 1000 * 60 * 10,
    });

    /**
     * Flag to force stop the collector.
     */
    let forceStop = false;

    collector.on("collect", async (i: any) => {
      if (forceStop) return;

      /** The current preview embed. */
      const embeds: any = i.message.embeds[0] as any;
      /** The current setup embed. */
      const setup: any = i.message.embeds[1] as any;

      switch (i.customId) {
        case "@Cancel":
          // Cancel the embed creation process.
          forceStop = true;
          return collector.stop();
        case "@Send":
          // Send the created embed to the selected channel.
          if (embeds.data.description === t("creatorEmbed.preview")) {
            return i.reply({
              content: t("creatorEmbed.errors.emptyEmbed"),
              flags: "Ephemeral",
            });
          }
          if (!channel) {
            return i.reply({
              content: t("creatorEmbed.errors.channelNotFound"),
              flags: "Ephemeral",
            });
          }

          if (channel.type !== ChannelType.GuildText) {
            return i.reply({
              content: t("creatorEmbed.errors.notTextChannel"),
              flags: "Ephemeral",
            });
          }
          await (channel as TextChannel).send({ embeds: [embeds] });
          await i.reply({ content: t("creatorEmbed.sent"), flags: "Ephemeral" });
          forceStop = true;
          return collector.stop();
        case "@fieldReturn":
          // Return from field editing to main menu.
          enableComponents(setupComponent, buttonComponent);
          await i.update({
            embeds: [embeds, setupEmbed],
            components: [setupComponent, buttonComponent],
          });
          break;
        case "@remField":
          // Remove the last field from the embed.
          if (!embeds.data.fields || embeds.data.fields.length === 0) {
            return i.reply({
              content: t("creatorEmbed.errors.noFields"),
              flags: "Ephemeral",
            });
          }
          embeds.data.fields.pop();
          await i.update({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });
          break;
        case "@addField":
          // Add a new field to the embed by collecting user input.
          setup.data.description = t("creatorEmbed.inputFields");
          disableComponents(fieldSetupComponent, fieldMenuComponent);
          await i.update({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });

          let msgArr;
          try {
            msgArr = (
              await (i.channel as TextChannel).awaitMessages({
                filter: (m) => m.author.id === i.user.id,
                max: 3,
                time: 60000,
                errors: ["time"],
              })
            ).first(3);
          } catch {
            await i.followUp({ content: t("creatorEmbed.errors.noFieldsTimeout") });
            enableComponents(fieldSetupComponent, fieldMenuComponent);
            return;
          }
          if (!msgArr || msgArr.length < 3) {
            await i.followUp({ content: t("creatorEmbed.errors.mustSendThreeFields") });
            enableComponents(fieldSetupComponent, fieldMenuComponent);
            return;
          }

          const fields = {
            name: msgArr[0].content,
            value: msgArr[1].content,
            inline: msgArr[2].content === "true",
          };

          if (!embeds.data.fields) {
            embeds.data.fields = [fields];
          } else {
            embeds.data.fields.push(fields);
          }

          enableComponents(fieldSetupComponent, fieldMenuComponent);
          setup.data.description = t("creatorEmbed.useButtonFields");
          await replies.edit({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });

          msgArr.forEach((m) => m.deletable && m.delete());
          break;
        case "@Menu":
          // Handle select menu options for editing embed properties.
          setupComponent.components[0].setDisabled(true);
          buttonComponent.components[1].setDisabled(true);
          const selectedOption = i.values[0];
          if (selectedOption === "timestamp") {
            embeds.data.timestamp = embeds.data.timestamp ? undefined : new Date(Date.now()).toISOString();
            i.update({
              embeds: [embeds, setupEmbed],
            });
          } else if (selectedOption === "fields") {
            setup.data.description = t("creatorEmbed.useButtonFields");
            await i.update({
              embeds: [embeds, setup],
              components: [fieldSetupComponent, fieldMenuComponent],
            });
          } else {
            setup.data.description = t("creatorEmbed.modifyByMessage");

            await i.update({
              embeds: [embeds, setup],
              components: [setupComponent, buttonComponent],
            });
            const msg = (
              await (i.channel as TextChannel).awaitMessages({
                filter: (m) => m.author.id === i.user.id,
                max: 1,
              })
            ).first();
            if (!msg) return;

            const attachment = msg.attachments.first();
            updateEmbedField(embeds, selectedOption, msg.content, attachment);

            setupComponent.components[0].setDisabled(false);
            buttonComponent.components[1].setDisabled(false);
            await replies.edit({
              embeds: [embeds, setupEmbed],
              components: [setupComponent, buttonComponent],
            });
            setTimeout(() => msg.delete(), 2500);
          }
          break;
      }
    });

    collector.on("end", (_c) => {
      // Handle collector end (timeout or manual stop).
      if (!forceStop && replies) {
        interaction.followUp({
          content: t("creatorEmbed.closed"),
          flags: "Ephemeral",
        });
      }
      replies.delete();
    });
  },
);
