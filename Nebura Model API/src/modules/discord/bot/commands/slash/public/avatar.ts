import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";

import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@/structure/extenders/discord/embeds.extender";

export default new Command(
  new SlashCommandBuilder()
    .setName(`avatar`)
    .setDescription(`Get anybody's Profile Picture / Banner.`)
    .addUserOption((option) =>
      option.setName(`user`).setDescription(`Select a user`).setRequired(false),
    ),
  async (client, interaction) => {
    if (!interaction.channel || !interaction.guild) return;

    const usermention = interaction.options.getUser(`user`) || interaction.user;
    const avatar = usermention.displayAvatarURL({ size: 1024, extension: "png" });
    const banner = await (
      await client.users.fetch(usermention.id, { force: true })
    ).bannerURL({ size: 4096 });

    if (!banner || !avatar)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Fetch User")
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} An error occurred while retrieving user data.`,
                `Please try again later`,
              ].join("\n"),
            ),
        ],
      });

    const cmp = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Avatar`)
        .setCustomId(`avatar`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Banner`).setCustomId(`banner`).setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Delete`).setCustomId(`delete`).setStyle(ButtonStyle.Danger),
    );

    const cmp2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel(`Avatar`).setCustomId(`avatar`).setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setLabel(`Banner`)
        .setCustomId(`banner`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Delete`).setCustomId(`delete`).setStyle(ButtonStyle.Danger),
    );

    const cmp3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Avatar`)
        .setCustomId(`avatar`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Delete`).setCustomId(`delete`).setStyle(ButtonStyle.Danger),
    );

    const embed = new EmbedCorrect()
      .setAuthor({
        name: `${usermention.tag}, avatar`,
        iconURL: `${usermention.displayAvatarURL()}`,
      })
      .setTitle(`Download`)
      .setURL(avatar)
      .setImage(avatar);

    const embed2 = new EmbedCorrect()
      .setAuthor({
        name: `${usermention.tag}, banner`,
        iconURL: `${usermention.displayAvatarURL()}`,
      })
      .setTitle(`Download`)
      .setURL(banner)
      .setImage(banner);

    if (!banner) {
      //checking if the user does not have a banner, so it will send profile icon.
      const message2 = await interaction.reply({ embeds: [embed], components: [cmp3] });
      const collector = await message2.createMessageComponentCollector();
      collector.on(`collect`, async (c) => {
        if (!interaction.guild) return;

        if (c.customId === "delete") {
          if (c.user.id !== interaction.user.id) {
            await c.reply({
              content: `${client.getEmoji(interaction.guild.id, "error")} Only ${interaction.user.tag} can interact with the buttons!`,
              flags: "Ephemeral",
            });
            return;
          }

          await interaction.deleteReply();
          return;
        }

        return; // Explicitly return in case no condition is met
      });
      return;
    }

    // sending embed with both profile icons, banner and avatar.
    const message = await interaction.reply({ embeds: [embed], components: [cmp] });
    const collector = await message.createMessageComponentCollector();

    collector.on(`collect`, async (c) => {
      if (!interaction.guild) return;

      if (c.customId === "avatar") {
        if (c.user.id !== interaction.user.id) {
          await c.reply({
            content: `${client.getEmoji(interaction.guild.id, "error")} Only ${interaction.user.tag} can interact with the buttons!`,
            flags: "Ephemeral",
          });
          return;
        }

        await c.update({ embeds: [embed], components: [cmp] });
        return;
      }

      if (c.customId === "banner") {
        if (c.user.id !== interaction.user.id) {
          await c.reply({
            content: `${client.getEmoji(interaction.guild.id, "error")} Only ${interaction.user.tag} can interact with the buttons!`,
            flags: "Ephemeral",
          });
          return;
        }

        await c.update({ embeds: [embed2], components: [cmp2] });
        return;
      }

      if (c.customId === "delete") {
        if (c.user.id !== interaction.user.id) {
          await c.reply({
            content: `${client.getEmoji(interaction.guild.id, "error")} Only ${interaction.user.tag} can interact with the buttons!`,
            flags: "Ephemeral",
          });
          return;
        }

        interaction.deleteReply();
        return;
      }

      return; // Explicitly return in case no condition is met
    });

    return;
  },
);
