import { AttachmentBuilder, ChannelType } from "discord.js";

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extenders/embeds.extend";

const phComment: Precommand = {
  name: "ph-comment",
  description: "The command to create a PornHub comment image.",
  examples: ["ph-comment @user I love this image!"],
  nsfw: false,
  owner: false,
  cooldown: 5,
  aliases: ["phc", "ph-comments"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const user = message.mentions.users.first() || message.author;
    const image = user.displayAvatarURL({
      size: 128,
      extension: "png",
      forceStatic: true,
    });

    const comment = args.slice(1).join(" ");
    if (!comment)
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} You need to provide a comment to be displayed on the image!`,
              `**Usage:** \`${prefix}ph-comment <user> <comment>\``,
            ].join("\n"),
          ),
        ],
      });

    const background = await loadImage("./assets/images/ph-comment.png");
    const targetImage = await loadImage(image.split("?")[0]);
    const canvas = createCanvas(background.width, background.height);
    const context = canvas.getContext("2d");

    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.save();
    context.beginPath();
    context.arc(25 + 25, 130 + 25, 25, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    context.drawImage(targetImage, 25, 130, 50, 50);
    context.restore();

    context.font = "bold 16px Arial";
    context.fillStyle = "#F28705";

    const usernameWidth = context.measureText(user.username).width;

    context.fillText(user.username, 85, 160);

    context.font = "16px Arial";
    context.fillStyle = "#969696";
    context.fillText("26 minutes ago", 85 + usernameWidth + 10, 160);

    context.font = "20px Arial";
    context.fillStyle = "#c6c6c6";
    context.fillText(comment, 25, 215);

    const file = new AttachmentBuilder(canvas.toBuffer("image/png"), {
      name: "ph-comment.png",
    });

    const embed = new EmbedCorrect()
      .setImage("attachment://ph-comment.png")
      .setColor("Random")
      .setTitle("PH Comment - Image")
      .setTimestamp();

    await message.delete();
    return await message.channel.send({ embeds: [embed], files: [file] });
  },
};
export = phComment;
