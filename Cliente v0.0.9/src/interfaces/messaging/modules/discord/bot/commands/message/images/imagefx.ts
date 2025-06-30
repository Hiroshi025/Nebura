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

    // Get image from attachment or message content
    const imageUrl = message.attachments.first()?.url || message.content.split(/\s+/)[1];

    if (!imageUrl) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Missing Image")
            .setDescription("Please attach an image or provide a URL!")
            .addFields(
              { name: "Example with attachment", value: "`!imagefx` (with image attached)" },
              { name: "Example with URL", value: "`!imagefx https://example.com/image.jpg`" },
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
        .setPlaceholder("Choose an effect...")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Blur").setValue("blur").setDescription("Soft blur effect"),
          new StringSelectMenuOptionBuilder().setLabel("Sharpen").setValue("sharpen").setDescription("Enhance details"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Pixelate")
            .setValue("pixelate")
            .setDescription("Mosaic pixel effect"),
          new StringSelectMenuOptionBuilder().setLabel("Sepia").setValue("sepia").setDescription("Vintage brown tone"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Grayscale")
            .setValue("grayscale")
            .setDescription("Black and white"),
          new StringSelectMenuOptionBuilder().setLabel("Invert").setValue("invert").setDescription("Negative colors"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Vignette")
            .setValue("vignette")
            .setDescription("Darkened edges"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Posterize")
            .setValue("posterize")
            .setDescription("Reduce color palette"),
        );

      const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      // Preview button
      const previewButton = new ButtonBuilder()
        .setCustomId("preview_effects")
        .setLabel("Preview Effects")
        .setStyle(ButtonStyle.Primary);

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(previewButton);

      const embed = new EmbedBuilder()
        .setColor("#0099FF")
        .setTitle("🎨 Image Effects Editor")
        .setDescription("Select an effect to apply to your image!")
        .setImage(imageUrl)
        .addFields(
          { name: "Original Image", value: `[View original](${imageUrl})`, inline: true },
          { name: "How to use", value: "Choose an effect from the menu below", inline: true },
        )
        .setFooter({ text: "Effects may take a few seconds to process" });

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
          await showEffectPreviews(interaction, imageBuffer);
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
              .setTitle(`✨ ${effect.charAt(0).toUpperCase() + effect.slice(1)} Effect`)
              .setImage(`attachment://effect_${effect}.png`)
              .setFooter({ text: "Want another effect? Select from the menu!" });

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
                  .setTitle("❌ Processing Error")
                  .setDescription("Failed to apply the effect. Please try again."),
              ],
              ephemeral: true,
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
            .setTitle("❌ Invalid Image")
            .setDescription("Couldn't process the image. Please check the URL or try a different image."),
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

async function showEffectPreviews(interaction: any, originalBuffer: Buffer): Promise<void> {
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
    .setTitle("🎭 Effect Previews")
    .setDescription("Here's a quick look at all available effects:")
    .setImage(`attachment://${previewAttachments[0].name}`)
    .addFields(
      { name: "Blur", value: "Soft focus", inline: true },
      { name: "Sharpen", value: "Enhanced details", inline: true },
      { name: "Pixelate", value: "Mosaic effect", inline: true },
      { name: "Sepia", value: "Vintage tone", inline: true },
      { name: "Grayscale", value: "Black & white", inline: true },
      { name: "Invert", value: "Negative colors", inline: true },
      { name: "Vignette", value: "Darkened edges", inline: true },
      { name: "Posterize", value: "Reduced colors", inline: true },
    )
    .setFooter({ text: "Select an effect from the menu to apply it to your full image" });

  await interaction.followUp({
    embeds: [previewEmbed],
    files: previewAttachments.map((a) => a.attachment),
    ephemeral: true,
  });
  return;
}

export = effectsCommand;
