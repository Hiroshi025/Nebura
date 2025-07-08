import { AttachmentBuilder, ChannelType } from "discord.js";

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const fbiCommand: Precommand = {
  name: "fbi",
  nameLocalizations: {
    "es-ES": "fbi",
    "en-US": "fbi",
  },
  description: "Generate an FBI achievement image with the provided text.",
  descriptionLocalizations: {
    "es-ES": "Genera una imagen de logro del FBI con el texto proporcionado.",
    "en-US": "Generate an FBI achievement image with the provided text.",
  },
  examples: ["fbi <text>"],
  nsfw: false,
  owner: false,
  category: "Entertainment",
  cooldown: 5,
  aliases: ["fbihere"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild?.preferredLocale || "es-ES";
    const text = args.join(" ");
    if (!text)
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:fbi.noText", { lng: lang })}`,
              `**${client.t("discord:fbi.usage", { prefix, lng: lang })}**`,
            ].join("\n"),
          ),
        ],
      });

    const background = await loadImage("./assets/images/why-fbi-here.png");
    const overlay = await loadImage("./assets/images/why-fbi-here-overlay.png");
    const canvas = createCanvas(background.width, background.height);
    const context = canvas.getContext("2d");
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.font = "30px Arial";
    context.fillText(text, 40, 290);

    context.drawImage(overlay, 627, 0, overlay.width, overlay.height);

    const file = new AttachmentBuilder(canvas.toBuffer("image/png"), {
      name: "why-fbi-here.png",
    });

    const embed = new EmbedCorrect()
      .setImage("attachment://why-fbi-here.png")
      .setColor("Random")
      .setTitle(client.t("discord:fbi.title", { lng: lang }))
      .setTimestamp();

    await message.delete();
    return await message.channel.send({ embeds: [embed], files: [file] });
  },
};
export = fbiCommand;
