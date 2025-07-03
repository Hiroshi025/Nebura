import axios from "axios";
import {
	ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} from "discord.js";
import sharp from "sharp";

import { Precommand } from "@typings/modules/discord";

const effectsCommand: Precommand = {
  name: "imagefx",
  description: "Apply cool effects to images!",
  examples: ["imagefx [attachment]", "imagefx [image URL]"],
  nsfw: false,
  category: "images",
  owner: false,
  cooldown: 30,
  aliases: ["filter", "imgefx", "photoedit"],
  botpermissions: ["SendMessages", "AttachFiles", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = _client.translations.getFixedT(lang, "discord");

    // Get image from attachment or message content
    const imageUrl = message.attachments.first()?.url || message.content.split(/\s+/)[1];

    if (!imageUrl) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("imagefx.missingImageTitle"))
            .setDescription(t("imagefx.missingImageDesc"))
            .addFields(
              { name: t("imagefx.exampleAttachment"), value: t("imagefx.exampleAttachmentValue") },
              { name: t("imagefx.exampleUrl"), value: t("imagefx.exampleUrlValue") },
            ),
        ],
      });
    }

    try {
      // Fetch the image
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data, "binary");

      // Create effect selection menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("effect_selector")
        .setPlaceholder(t("imagefx.selectPlaceholder"))
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.blur")).setValue("blur").setDescription(t("imagefx.blurDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.sharpen")).setValue("sharpen").setDescription(t("imagefx.sharpenDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.pixelate")).setValue("pixelate").setDescription(t("imagefx.pixelateDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.sepia")).setValue("sepia").setDescription(t("imagefx.sepiaDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.grayscale")).setValue("grayscale").setDescription(t("imagefx.grayscaleDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.invert")).setValue("invert").setDescription(t("imagefx.invertDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.vignette")).setValue("vignette").setDescription(t("imagefx.vignetteDesc")),
          new StringSelectMenuOptionBuilder().setLabel(t("imagefx.posterize")).setValue("posterize").setDescription(t("imagefx.posterizeDesc")),
        );

      const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      // Preview button
      const previewButton = new ButtonBuilder()
        .setCustomId("preview_effects")
        .setLabel(t("imagefx.previewButton"))
        .setStyle(ButtonStyle.Primary);

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(previewButton);

      const embed = new EmbedBuilder()
        .setColor("#0099FF")
        .setTitle(t("imagefx.editorTitle"))
        .setDescription(t("imagefx.editorDesc"))
        .setImage(imageUrl)
        .addFields(
          { name: t("imagefx.originalField"), value: `[${t("imagefx.viewOriginal")}](${imageUrl})`, inline: true },
          { name: t("imagefx.howToUseField"), value: t("imagefx.howToUseValue"), inline: true },
        )
        .setFooter({ text: t("imagefx.effectsFooter") });

      const reply = await message.reply({
        embeds: [embed],
        components: [actionRow, buttonRow],
      });

      // Collector for effect selection
      const collector = reply.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (interaction) => {
        if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

        await interaction.deferUpdate();

        if (interaction.isButton() && interaction.customId === "preview_effects") {
          // Show preview of all effects
          await showEffectPreviews(interaction, imageBuffer, t);
          return;
        }

        if (interaction.isStringSelectMenu()) {
          const effect = interaction.values[0];
          let processedImage: Buffer;

          try {
            switch (effect) {
              case "blur":
                processedImage = await sharp(imageBuffer).blur(10).toBuffer();
                break;
              case "sharpen":
                processedImage = await sharp(imageBuffer).sharpen({ sigma: 2 }).toBuffer();
                break;
              case "pixelate":
                processedImage = await pixelateEffect(imageBuffer);
                break;
              case "sepia":
                processedImage = await sharp(imageBuffer)
                  .modulate({
                    saturation: 0.5,
                  })
                  .tint("#704214")
                  .toBuffer();
                break;
              case "grayscale":
                processedImage = await sharp(imageBuffer).grayscale().toBuffer();
                break;
              case "invert":
                processedImage = await sharp(imageBuffer).negate().toBuffer();
                break;
              case "vignette":
                processedImage = await vignetteEffect(imageBuffer);
                break;
              case "posterize":
                processedImage = await sharp(imageBuffer).png({ quality: 10 }).toBuffer();
                break;
              default:
                processedImage = imageBuffer;
            }

            const attachment = new AttachmentBuilder(processedImage, { name: `effect_${effect}.png` });

            const resultEmbed = new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle(`✨ ${t(`imagefx.${effect}`)} ${t("imagefx.effectTitle")}`)
              .setImage(`attachment://effect_${effect}.png`)
              .setFooter({ text: t("imagefx.selectAnother") });

            await interaction.editReply({
              embeds: [resultEmbed],
              files: [attachment],
              components: [actionRow, buttonRow],
            });
          } catch (error) {
            console.error("Error processing image:", error);
            await interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setColor("#FF0000")
                  .setTitle(t("imagefx.processingErrorTitle"))
                  .setDescription(t("imagefx.processingErrorDesc")),
              ],
              flags: "Ephemeral"
            });
          }
        }
      });

      collector.on("end", () => {
        reply.edit({ components: [] }).catch(console.error);
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("imagefx.invalidImageTitle"))
            .setDescription(t("imagefx.invalidImageDesc")),
        ],
      });
    }
    return;
  },
};

async function pixelateEffect(buffer: Buffer): Promise<Buffer> {
  // First resize to small size then scale back up for pixelation effect
  return sharp(buffer)
    .resize(32, 32, { kernel: sharp.kernel.nearest })
    .resize(512, 512, { kernel: sharp.kernel.nearest })
    .toBuffer();
}

async function vignetteEffect(buffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 1000;
  const height = metadata.height || 1000;

  // Create vignette overlay
  const vignette = Buffer.from(
    `<svg width="${width}" height="${height}">
            <radialGradient id="gradient" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stop-color="white" stop-opacity="1"/>
                <stop offset="100%" stop-color="black" stop-opacity="1"/>
            </radialGradient>
            <rect x="0" y="0" width="${width}" height="${height}" fill="url(#gradient)" opacity="0.5"/>
        </svg>`,
  );

  return sharp(buffer)
    .composite([{ input: vignette, blend: "multiply" }])
    .toBuffer();
}

async function showEffectPreviews(interaction: any, originalBuffer: Buffer, t: any): Promise<void> {
  // Create small previews of all effects
  const effects = ["blur", "sharpen", "pixelate", "sepia", "grayscale", "invert", "vignette", "posterize"];
  const previewSize = 200;

  const previewPromises = effects.map(async (effect) => {
    let processedBuffer: Buffer;

    switch (effect) {
      case "blur":
        processedBuffer = await sharp(originalBuffer).resize(previewSize, previewSize).blur(5).toBuffer();
        break;
      case "sharpen":
        processedBuffer = await sharp(originalBuffer).resize(previewSize, previewSize).sharpen({ sigma: 2 }).toBuffer();
        break;
      case "pixelate":
        processedBuffer = await sharp(originalBuffer)
          .resize(16, 16, { kernel: sharp.kernel.nearest })
          .resize(previewSize, previewSize, { kernel: sharp.kernel.nearest })
          .toBuffer();
        break;
      case "sepia":
        processedBuffer = await sharp(originalBuffer)
          .resize(previewSize, previewSize)
          .modulate({
            saturation: 0.5,
          })
          .tint("#704214")
          .toBuffer();
        break;
      case "grayscale":
        processedBuffer = await sharp(originalBuffer).resize(previewSize, previewSize).grayscale().toBuffer();
        break;
      case "invert":
        processedBuffer = await sharp(originalBuffer).resize(previewSize, previewSize).negate().toBuffer();
        break;
      case "vignette":
        processedBuffer = await sharp(originalBuffer)
          .resize(previewSize, previewSize)
          .composite([
            {
              input: Buffer.from(
                `<svg width="${previewSize}" height="${previewSize}">
                                <radialGradient id="gradient" cx="50%" cy="50%" r="75%">
                                    <stop offset="0%" stop-color="white" stop-opacity="1"/>
                                    <stop offset="100%" stop-color="black" stop-opacity="1"/>
                                </radialGradient>
                                <rect x="0" y="0" width="${previewSize}" height="${previewSize}" fill="url(#gradient)" opacity="0.5"/>
                            </svg>`,
              ),
              blend: "multiply",
            },
          ])
          .toBuffer();
        break;
      case "posterize":
        processedBuffer = await sharp(originalBuffer).resize(previewSize, previewSize).png({ quality: 10 }).toBuffer();
        break;
      default:
        processedBuffer = await sharp(originalBuffer).resize(previewSize, previewSize).toBuffer();
    }

    return {
      name: `${effect}.png`,
      attachment: new AttachmentBuilder(processedBuffer),
    };
  });

  const previewAttachments = await Promise.all(previewPromises);

  const previewEmbed = new EmbedBuilder()
    .setColor("#9B59B6")
    .setTitle(t("imagefx.previewTitle"))
    .setDescription(t("imagefx.previewDesc"))
    .setImage(`attachment://${previewAttachments[0].name}`)
    .addFields(
      { name: t("imagefx.blur"), value: t("imagefx.blurDesc"), inline: true },
      { name: t("imagefx.sharpen"), value: t("imagefx.sharpenDesc"), inline: true },
      { name: t("imagefx.pixelate"), value: t("imagefx.pixelateDesc"), inline: true },
      { name: t("imagefx.sepia"), value: t("imagefx.sepiaDesc"), inline: true },
      { name: t("imagefx.grayscale"), value: t("imagefx.grayscaleDesc"), inline: true },
      { name: t("imagefx.invert"), value: t("imagefx.invertDesc"), inline: true },
      { name: t("imagefx.vignette"), value: t("imagefx.vignetteDesc"), inline: true },
      { name: t("imagefx.posterize"), value: t("imagefx.posterizeDesc"), inline: true },
    )
    .setFooter({ text: t("imagefx.previewFooter") });

  await interaction.followUp({
    embeds: [previewEmbed],
    files: previewAttachments.map((a) => a.attachment),
    flags: "Ephemeral",
  });
  return;
}

export = effectsCommand;
