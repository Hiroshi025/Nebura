import { AttachmentBuilder, ChannelType } from "discord.js";

import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extend";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Precommand } from "@typings/modules/discord";

const fbiCommand: Precommand = {
  name: "fbi",
  description: "Generate an FBI achievement image with the provided text.",
  examples: ["fbi <text>"],
  nsfw: false,
  owner: false,
  cooldown: 5,
  aliases: ["fbihere"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;
    const text = args.join(" ");
    if (!text)
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} You need to provide text to be displayed on the image!`,
              `**Usage:** \`${prefix}fbi <text>\``,
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
      .setTitle("PH Comment - Image")
      .setTimestamp();

    await message.delete();
    return await message.channel.send({ embeds: [embed], files: [file] });
  },
};
export = fbiCommand;
