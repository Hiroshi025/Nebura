import { AttachmentBuilder, ChannelType } from "discord.js";

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const achievementCommand: Precommand = {
  name: "achievement",
  description: "The command to create an achievement image.",
  examples: ["achievement I made a new achievement!"],
  nsfw: false,
  owner: false,
  category: "images",
  cooldown: 5,
  aliases: ["ach", "achieve", "achv", "achvmnt", "achievemnt", "achievement-get", "achievement-getter"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const text = args.join(" ");
    if (!text)
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} You need to provide a text to generate an achievement image!`,
                `**Usage:** \`${prefix}achievement <text>\``,
              ].join("\n"),
            )
            .setColor("Red"),
        ],
      });

    const background = await loadImage("./assets/images/achievement.png");

    const canvas = createCanvas(background.width, background.height);
    const context = canvas.getContext("2d");
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.translate(120, 60);
    context.font = "24px Arial";
    context.fillStyle = "#c2c2c2";
    context.fillText(text, 10, 22, 330);

    const file = new AttachmentBuilder(canvas.toBuffer("image/png"), {
      name: "achievement.png",
    });

    const embed = new EmbedCorrect()
      .setImage("attachment://achievement.png")
      .setColor("Random")
      .setTitle("PH Comment - Image")
      .setTimestamp();

    await message.delete();
    return await message.channel.send({ embeds: [embed], files: [file] });
  },
};
export = achievementCommand;
