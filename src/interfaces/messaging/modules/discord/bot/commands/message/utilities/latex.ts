import axios from "axios";
import {
	ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder
} from "discord.js";

import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const latexCommand: Precommand = {
  name: "latex",
  nameLocalizations: {
    "es-ES": "latex",
    "en-US": "latex",
  },
  description: "Render LaTeX mathematical formulas to image",
  descriptionLocalizations: {
    "es-ES": "Renderiza fórmulas matemáticas en LaTeX a imagen",
    "en-US": "Render LaTeX mathematical formulas to image",
  },
  examples: ["latex \\frac{x}{y}", "latex f(x) = x^2 + 3x - 2"],
  nsfw: false,
  category: "Utility",
  owner: false,
  cooldown: 10,
  aliases: ["tex", "formula"],
  botpermissions: ["SendMessages", "AttachFiles"],
  permissions: ["SendMessages"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild.preferredLocale || "en-US";

    if (!args.length) {
      const embed = new EmbedCorrect()
        .setTitle(client.t("discord:latex.error.title", { lng: lang }))
        .setDescription(client.t("discord:latex.error.noFormula", { lng: lang }))
        .addFields({
          name: client.t("discord:latex.example", { lng: lang }),
          value: "`/latex \\frac{x}{y}`\n`/latex f(x) = x^2 + 3x - 2`",
        });

      return message.channel.send({ embeds: [embed] });
    }

    const latexFormula = args.join(" ");

    try {
      // Usamos CodeCogs como servicio de renderizado de LaTeX
      const latexUrl = `https://latex.codecogs.com/png.latex?\\dpi{150}\\bg{white}\\color{black}${encodeURIComponent(`\\large ${latexFormula}`)}`;

      // Descargamos la imagen
      const response = await axios.get(latexUrl, { responseType: "arraybuffer" });

      if (response.status !== 200) {
        throw new Error("Failed to render LaTeX");
      }

      // Creamos un attachment
      const attachment = new AttachmentBuilder(Buffer.from(response.data), { name: "formula.png" });

      const embed = new EmbedBuilder()
        .setTitle(client.t("discord:latex.success.title", { lng: lang }))
        .setColor(0x0099ff)
        .setImage("attachment://formula.png")
        .setFooter({ text: client.t("discord:latex.footer", { lng: lang }) });

      // Botón para editar en LaTeX online
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(client.t("discord:latex.editOnline", { lng: lang }))
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.codecogs.com/latex/eqneditor.php?latex=${encodeURIComponent(latexFormula)}`),
      );

      return message.channel.send({
        embeds: [embed],
        files: [attachment],
        components: [row],
      });
    } catch (error) {
      console.error(error);
      const embed = new EmbedCorrect()
        .setTitle(client.t("discord:latex.error.title", { lng: lang }))
        .setDescription(client.t("discord:latex.error.renderFailed", { lng: lang }))
        .addFields({
          name: client.t("discord:latex.tip", { lng: lang }),
          value: client.t("discord:latex.tryEscaping", { lng: lang }),
        });

      return message.channel.send({ embeds: [embed] });
    }
  },
};

export default latexCommand;
