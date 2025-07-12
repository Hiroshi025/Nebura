import { client, main } from "@/main";
import { createEvent } from "@messaging/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";

function generateReviewId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default createEvent({
  data: { name: "interactionCreate" },
  async run(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (!interaction.guild) return;

    const lang =
      (await (await import("@/main")).main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } }))
        ?.lenguage ||
      interaction.locale ||
      "es-ES";
    const t = (key: string, options?: any) => client.translations.t("discord:" + key, { lng: lang, ...options });

    // Handle review creation
    if (interaction.customId.startsWith("reviewCreate_")) {
      const targetId = interaction.customId.split("_")[1];
      const stars = parseInt(interaction.fields.getTextInputValue("stars"));
      const content = interaction.fields.getTextInputValue("content");
      const anonymous = interaction.fields.getTextInputValue("anonymous")?.toLowerCase() === "yes";

      // Validate stars
      if (isNaN(stars) || stars < 1 || stars > 5) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.invalidStars"))],
          ephemeral: true,
        });
      }

      // Get config
      const config = await main.prisma.reviewConfig.findUnique({
        where: { guildId: interaction.guild.id },
      });
      if (!config) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.noConfig"))],
          ephemeral: true,
        });
      }

      // Create custom ID
      const customId = generateReviewId();

      // Create review
      const review = await main.prisma.review.create({
        data: {
          guildId: interaction.guild.id,
          channelId: config.channelId,
          customId,
          stars,
          content,
          targetId,
          authorId: interaction.user.id,
          anonymous,
        },
      });

      // Post review to channel
      const targetUser = await client.users.fetch(targetId).catch(() => null);
      const authorUser = anonymous ? null : interaction.user;

      const embed = new EmbedCorrect()
        .setTitle(t("review.post.title", { id: customId }))
        .setDescription(content)
        .addFields([
          { name: t("review.post.stars"), value: "⭐".repeat(stars) + "☆".repeat(5 - stars), inline: true },
          {
            name: t("review.post.target"),
            value: targetUser ? targetUser.toString() : t("review.post.userLeft"),
            inline: true,
          },
          {
            name: t("review.post.author"),
            value: authorUser ? authorUser.toString() : t("review.post.anonymous"),
            inline: true,
          },
        ])
        .setColor("#FFD700")
        .setFooter({
          text: t("review.post.footer", { guild: interaction.guild.name }),
          iconURL: interaction.guild.iconURL() as string,
        });

      const reviewChannel = await interaction.guild.channels.fetch(config.channelId);
      if (reviewChannel?.isTextBased()) {
        const message = await reviewChannel.send({ embeds: [embed] });

        // Update review with message ID
        await main.prisma.review.update({
          where: { id: review.id },
          data: { messageId: message.id },
        });
      }

      await interaction.reply({
        embeds: [new EmbedCorrect().setDescription(t("review.post.success", { id: customId }))],
        ephemeral: true,
      });
    }

    // Handle review editing
    if (interaction.customId.startsWith("reviewEdit_")) {
      const reviewId = interaction.customId.split("_")[1];
      const stars = parseInt(interaction.fields.getTextInputValue("stars"));
      const content = interaction.fields.getTextInputValue("content");
      const anonymous = interaction.fields.getTextInputValue("anonymous")?.toLowerCase() === "yes";

      // Validate stars
      if (isNaN(stars) || stars < 1 || stars > 5) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.errors.invalidStars"))],
          ephemeral: true,
        });
      }

      // Update review
      const review = await main.prisma.review.update({
        where: {
          customId: reviewId,
          guildId: interaction.guild.id,
          authorId: interaction.user.id,
        },
        data: {
          stars,
          content,
          anonymous,
        },
      });

      // Update message in channel if exists
      if (review.messageId) {
        const reviewChannel = await interaction.guild.channels.fetch(review.channelId);
        if (reviewChannel?.isTextBased()) {
          try {
            const message = await reviewChannel.messages.fetch(review.messageId);

            const targetUser = await client.users.fetch(review.targetId).catch(() => null);
            const authorUser = anonymous ? null : await client.users.fetch(review.authorId).catch(() => null);

            const embed = new EmbedCorrect()
              .setTitle(t("review.post.title", { id: reviewId }))
              .setDescription(content)
              .addFields([
                { name: t("review.post.stars"), value: "⭐".repeat(stars) + "☆".repeat(5 - stars), inline: true },
                {
                  name: t("review.post.target"),
                  value: targetUser ? targetUser.toString() : t("review.post.userLeft"),
                  inline: true,
                },
                {
                  name: t("review.post.author"),
                  value: authorUser ? authorUser.toString() : t("review.post.anonymous"),
                  inline: true,
                },
              ])
              .setColor("#FFD700")
              .setFooter({
                text: t("review.post.footer", { guild: interaction.guild.name }),
                iconURL: interaction.guild.iconURL() as string,
              });

            await message.edit({ embeds: [embed] });
          } catch (error) {
            console.error("Failed to edit review message:", error);
          }
        }
      }

      await interaction.reply({
        embeds: [new EmbedCorrect().setDescription(t("review.edit.success", { id: reviewId }))],
        ephemeral: true,
      });
    }

    // Handle setup
    if (interaction.customId === "reviewSetup") {
      const channelId = interaction.fields.getTextInputValue("channelId");
      const requiredRoleId = interaction.fields.getTextInputValue("requiredRoleId") || null;
      const minReviewLength = parseInt(interaction.fields.getTextInputValue("minReviewLength"));
      const maxReviewLength = parseInt(interaction.fields.getTextInputValue("maxReviewLength"));

      // Validate channel
      const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.setup.invalidChannel"))],
          ephemeral: true,
        });
      }

      // Validate role if provided
      if (requiredRoleId) {
        const role = await interaction.guild.roles.fetch(requiredRoleId).catch(() => null);
        if (!role) {
          return interaction.reply({
            embeds: [new ErrorEmbed().setDescription(t("review.setup.invalidRole"))],
            ephemeral: true,
          });
        }
      }

      // Validate lengths
      if (
        isNaN(minReviewLength) ||
        isNaN(maxReviewLength) ||
        minReviewLength < 1 ||
        maxReviewLength < minReviewLength
      ) {
        return interaction.reply({
          embeds: [new ErrorEmbed().setDescription(t("review.setup.invalidLengths"))],
          ephemeral: true,
        });
      }

      // Create config
      await main.prisma.reviewConfig.create({
        data: {
          guildId: interaction.guild.id,
          channelId,
          requiredRoleId,
          minReviewLength,
          maxReviewLength,
          allowAnonymous: true,
          cooldown: 0,
        },
      });

      await interaction.reply({
        embeds: [new EmbedCorrect().setDescription(t("review.setup.success", { channel: channel.toString() }))],
        ephemeral: true,
      });
    }

    return;
  },
});
