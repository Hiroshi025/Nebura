import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	SlashCommandBuilder, StringSelectMenuBuilder, TextChannel
} from "discord.js";

import { Command } from "@/modules/discord/structure/utils/builders";
import {
	createButton, disableComponents, enableComponents, getMenuOptions, updateEmbedField
} from "@/modules/discord/structure/utils/functions";

export default new Command(
  new SlashCommandBuilder()
    .setName("embed-creator")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Create custom embeds")
    .addChannelOption((opt) =>
      opt.setName("channel").setDescription("Send the embed to a different channel"),
    ),
  async (_client, interaction) => {
    const { options, member } = interaction;
    const channel = options.getChannel("channel") || interaction.channel;

    const previewEmbed = new EmbedBuilder().setDescription(
      "Preview Embeds. Start editing to see changes~",
    );
    const setupEmbed = new EmbedBuilder()
      .setColor("#7700ff")
      .setTitle("Settings")
      .setDescription("Use Select Menu below to edit preview");

    const buttons = {
      send: createButton("@Send", "Send", ButtonStyle.Success),
      cancel: createButton("@Cancel", "Cancel", ButtonStyle.Danger),
      return: createButton("@fieldReturn", "Return", ButtonStyle.Secondary),
      addField: createButton("@addField", "Add", ButtonStyle.Success),
      removeField: createButton("@remField", "Remove", ButtonStyle.Danger),
    };

    const menu = new StringSelectMenuBuilder()
      .setCustomId("@Menu")
      .setPlaceholder("Edit Preview")
      .setMaxValues(1)
      .setMinValues(1)
      .setOptions(getMenuOptions());

    const setupComponent = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const buttonComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.cancel,
      buttons.send,
    );
    const fieldSetupComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.removeField,
      buttons.addField,
    );
    const fieldMenuComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.return);

    const replies = await interaction.reply({
      embeds: [previewEmbed, setupEmbed],
      components: [setupComponent, buttonComponent],
    });

    const filter = (i: any) => !!member && i.user.id === member.user.id;
    const collector = replies.createMessageComponentCollector({
      filter,
      idle: 1000 * 60 * 10,
    });

    let forceStop = false;

    collector.on("collect", async (i: any) => {
      if (forceStop) return;

      const embeds: any = i.message.embeds[0] as any;
      const setup: any = i.message.embeds[1] as any;

      switch (i.customId) {
        case "@Cancel":
          forceStop = true;
          return collector.stop();
        case "@Send":
          if (embeds.data.description === "Preview Embeds. Start editing to see changes~") {
            return i.reply({
              content: "Cannot send empty embed or without description!",
              flags: "Ephemeral",
            });
          }
          if (!channel) {
            return i.reply({
              content: "Channel not found. Cannot send the embed.",
              flags: "Ephemeral",
            });
          }

          if (channel.type !== ChannelType.GuildText) {
            return i.reply({
              content: "Please select a text channel to send the embed.",
              flags: "Ephemeral",
            });
          }
          await (channel as TextChannel).send({ embeds: [embeds] });
          await i.reply({ content: "Embed Sent!", flags: "Ephemeral" });
          forceStop = true;
          return collector.stop();
        case "@fieldReturn":
          enableComponents(setupComponent, buttonComponent);
          await i.update({
            embeds: [embeds, setupEmbed],
            components: [setupComponent, buttonComponent],
          });
          break;
        case "@remField":
          if (!embeds.data.fields || embeds.data.fields.length === 0) {
            return i.reply({
              content: "No Fields Detected",
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
          setup.data.description = "Input Fields.\nSend field Name > Value > Inline: true | false";
          disableComponents(fieldSetupComponent, fieldMenuComponent);
          await i.update({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });

          const msgArr = (
            await (i.channel as TextChannel).awaitMessages({
              filter: (m) => m.author.id === i.user.id,
              max: 3,
            })
          ).first(3);
          if (msgArr.length < 3) return;

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
          setup.data.description = "Use the button below to add or remove fields";
          await replies.edit({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });

          msgArr.forEach((m) => m.delete());
          break;
        case "@Menu":
          setupComponent.components[0].setDisabled(true);
          buttonComponent.components[1].setDisabled(true);
          const selectedOption = i.values[0];
          if (selectedOption === "timestamp") {
            embeds.data.timestamp = embeds.data.timestamp
              ? undefined
              : new Date(Date.now()).toISOString();
            i.update({
              embeds: [embeds, setupEmbed],
            });
          } else if (selectedOption === "fields") {
            setup.data.description = "Use the button below to add or remove fields";
            await i.update({
              embeds: [embeds, setup],
              components: [fieldSetupComponent, fieldMenuComponent],
            });
          } else {
            setup.data.description =
              "Modify by sending message to the channel\n-# For image you can upload image directly or use direct url";

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
      if (!forceStop && replies) {
        interaction.followUp({
          content: "Embed Editor closed due to inactivity.",
          flags: "Ephemeral",
        });
      }
      replies.delete();
    });
  },
);
