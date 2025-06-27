import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder
} from "discord.js";
import { createWorker } from "tesseract.js";

import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

const ocrCommand: Precommand = {
  name: "extracttext",
  description: "Extract text from images using OCR",
  examples: ["extracttext [attachment|URL]", "ocr [image]"],
  nsfw: false,
  owner: false,
  cooldown: 60,
  aliases: ["ocr", "imagetext", "readimage"],
  botpermissions: ["SendMessages", "EmbedLinks", "AttachFiles"],
  permissions: ["SendMessages"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Check for attachments or URLs
    const imageUrl = args[0]?.match(/https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|bmp|webp)/gi)?.[0];
    const attachment = message.attachments.first();

    if (!imageUrl && !attachment) {
      return message.reply({
        embeds: [
          new EmbedCorrect()
            .setTitle("❌ Error")
            .setDescription(
              "Please provide an image attachment or valid image URL\nSupported formats: PNG, JPG, JPEG, GIF, BMP, WEBP",
            ),
        ],
      });
    }

    const targetImage = attachment?.url || imageUrl;
    if (!targetImage) {
      return message.reply({
        embeds: [
          new EmbedCorrect()
            .setTitle("❌ Error")
            .setDescription("No valid image found. Please attach an image or provide a valid image URL."),
        ],
      });
    }

    // Validate image URL
    try {
      new URL(targetImage);
    } catch {
      return message.reply({
        embeds: [new EmbedCorrect().setTitle("❌ Invalid URL").setDescription("Please provide a valid image URL")],
      });
    }

    // Check if the URL points to an image
    if (!targetImage.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
      return message.reply({
        embeds: [
          new EmbedCorrect()
            .setTitle("❌ Invalid Image Format")
            .setDescription("Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP"),
        ],
      });
    }

    // Processing message
    const processingMsg = await message.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("🔍 Processing Image...")
          .setDescription("Extracting text from the provided image")
          .setFooter({ text: "This may take a moment" }),
      ],
    });

    try {
      // Download the image
      const response = await axios.get(targetImage, {
        responseType: "arraybuffer",
      });

      // Initialize Tesseract.js worker
      const worker = await createWorker({
        logger: (m) => console.log(m),
      });

      await worker.loadLanguage("eng+spa+fra+deu+por+rus");
      await worker.initialize("eng+spa+fra+deu+por+rus");

      // Perform OCR
      const {
        data: { text, hocr, confidence },
      } = await worker.recognize(response.data);
      await worker.terminate();

      // Analyze image metadata
      const imageInfo = await extractImageMetadata(response.data);

      // Prepare results
      const extractedText = text.trim() || "No text could be extracted from this image.";
      const confidencePercentage = Math.round(confidence * 100) / 100;

      // Create result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle("📝 Extracted Text Results")
        .setColor("#4CAF50")
        .addFields(
          {
            name: "Extracted Text",
            value: extractedText.slice(0, 1000) + (extractedText.length > 1000 ? "..." : ""),
            inline: false,
          },
          { name: "Confidence", value: `${confidencePercentage}%`, inline: true },
          { name: "Image Format", value: imageInfo.format || "Unknown", inline: true },
          { name: "Dimensions", value: imageInfo.dimensions || "Unknown", inline: true },
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Create action buttons
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`fulltext_${message.id}`)
          .setLabel("View Full Text")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`rawdata_${message.id}`)
          .setLabel("View Raw Data")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setLabel("Original Image").setStyle(ButtonStyle.Link).setURL(targetImage),
      );

      // Edit processing message with results
      await processingMsg.edit({
        embeds: [resultEmbed],
        components: [actionRow],
      });

      // Create collector for buttons
      const collector = processingMsg.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith(`fulltext_`) && !interaction.customId.startsWith(`rawdata_`)) return;

        try {
          if (interaction.customId.startsWith(`fulltext_`)) {
            // Send full text as file if too long
            if (extractedText.length > 2000) {
              await interaction.reply({
                content: "The extracted text is too long for a message. Here's a file with the complete text:",
                files: [
                  {
                    attachment: Buffer.from(extractedText),
                    name: "extracted_text.txt",
                  },
                ],
                ephemeral: true,
              });
            } else {
              await interaction.reply({
                content: `**Complete Extracted Text:**\n\`\`\`\n${extractedText}\n\`\`\``,
                ephemeral: true,
              });
            }
          } else if (interaction.customId.startsWith(`rawdata_`)) {
            // Send raw OCR data
            const rawData = {
              text,
              confidence,
              hocr: hocr ? "Available (too large to display)" : "Not available",
              metadata: imageInfo,
            };

            await interaction.reply({
              content: `**Raw OCR Data:**\n\`\`\`json\n${JSON.stringify(rawData, null, 2).slice(0, 1900)}\n\`\`\``,
              ephemeral: true,
            });
          }
        } catch (error) {
          console.error("Error handling button interaction:", error);
          await interaction.reply({
            content: "❌ An error occurred while processing your request.",
            ephemeral: true,
          });
        }
      });
    } catch (error) {
      console.error("OCR Processing Error:", error);
      await processingMsg.edit({
        embeds: [
          new EmbedCorrect()
            .setTitle("❌ Processing Failed")
            .setDescription(
              "An error occurred while processing the image.\nPossible reasons:\n- Image is too complex\n- No readable text present\n- Unsupported image format",
            )
            .setColor("#F44336"),
        ],
        components: [],
      });
    }

    return;
  },
};

// Helper function to extract basic image metadata
async function extractImageMetadata(buffer: Buffer): Promise<{
  format?: string;
  dimensions?: string;
  size?: string;
}> {
  try {
    // Simple image type detection
    const signatures = {
      "89504E47": "PNG",
      FFD8FF: "JPEG",
      "47494638": "GIF",
      "424D": "BMP",
      "52494646": "WEBP",
    };

    const hex = buffer.toString("hex", 0, 8).toUpperCase();
    let format: string | undefined;

    for (const [sig, type] of Object.entries(signatures)) {
      if (hex.startsWith(sig)) {
        format = type;
        break;
      }
    }

    // Get dimensions for PNG/JPEG (simplified)
    let width, height;
    if (format === "PNG") {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    } else if (format === "JPEG") {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xffc0 || marker === 0xffc2) {
          height = buffer.readUInt16BE(offset + 3);
          width = buffer.readUInt16BE(offset + 5);
          break;
        } else {
          const len = buffer.readUInt16BE(offset);
          offset += len;
        }
      }
    }

    return {
      format,
      dimensions: width && height ? `${width}x${height}px` : undefined,
      size: `${(buffer.length / 1024).toFixed(2)} KB`,
    };
  } catch {
    return {};
  }
}

export = ocrCommand;
