import {
	ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, codeBlock
} from "discord.js";
import { inspect } from "util";

import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Precommand } from "@typings/modules/discord";

const EvalCommand: Precommand = {
  name: "eval",
  description: "Evaluates a JavaScript code",
  examples: ["eval 1 + 1"],
  nsfw: false,
  owner: true,
  permissions: ["SendMessages"],
  cooldown: 10,
  aliases: ["e"],
  botpermissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (
      !message.guild ||
      !message.channel ||
      message.channel.type !== ChannelType.GuildText ||
      client.user?.id === message.author.id
    )
      return undefined;

    const code = args.join(" ");
    if (!code)
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setError(true)
            .setTitle("❌ Error: Missing Code")
            .setDescription(
              [
                `${emojis.error} **No code was provided for evaluation.**`,
                `> **Correct Usage:** \`${prefix}eval <code>\``,
              ].join("\n"),
            ),
        ],
      });

    try {
      const start = process.hrtime();
      const evaluated = await eval(code);
      const stop = process.hrtime(start);

      let output = inspect(evaluated, { depth: 0 });
      let attachment;
      let downloadButton;

      if (output.length > 1000) {
        const fileName = `eval_output_${Date.now()}.txt`;
        attachment = new AttachmentBuilder(Buffer.from(output), {
          name: fileName,
        });
        output = `The result is too long. Check the attached file or use the button below to download it.`;

        downloadButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Download Result")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`download_${message.author.id}_${fileName}`),
        );
      }

      const executionTimeMs = (stop[0] * 1e9 + stop[1]) / 1e6;
      const executionTimeSec = `${stop[0]}.${Math.floor(stop[1] / 1e6)}s`;

      const response = new EmbedCorrect().setTitle("✅ Evaluation Successful").addFields(
        {
          name: "📥 **Input Code**",
          value: codeBlock("js", code),
        },
        {
          name: "📤 **Result**",
          value: codeBlock("js", output),
        },
        {
          name: "⏱️ **Execution Time**",
          value: `**Milliseconds:** \`${executionTimeMs.toFixed(3)}ms\`\n**Seconds:** \`${executionTimeSec}\``,
          inline: true,
        },
        {
          name: "📄 **Result Type**",
          value: `\`${typeof evaluated}\``,
          inline: true,
        },
        {
          name: "👤 **Executed By**",
          value: `<@${message.author.id}>`,
          inline: true,
        },
        {
          name: "📍 **Executed In**",
          value: `**Channel:** <#${message.channel.id}>\n**Guild:** \`${message.guild.name}\``,
          inline: true,
        },
      );

      return message.channel.send({
        embeds: [response],
        files: attachment ? [attachment] : [],
        components: downloadButton ? [downloadButton] : [],
      });
    } catch (e: any) {
      logWithLabel("error", `Error in eval command: ${e}`);
      console.error(e);

      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setError(true)
            .setTitle("❌ Evaluation Error")
            .setDescription(
              [
                `${emojis.error} **An error occurred while evaluating the code.**`,
                `> **Correct Usage:** \`${prefix}eval <code>\``,
              ].join("\n"),
            )
            .addFields(
              {
                name: "⚠️ **Error Message**",
                value: codeBlock("js", e.message || "Unknown error"),
              },
              {
                name: "📚 **Stack Trace**",
                value: codeBlock("js", e.stack || "Not available"),
              },
            ),
        ],
      });
    }
  },
};

export = EvalCommand;
