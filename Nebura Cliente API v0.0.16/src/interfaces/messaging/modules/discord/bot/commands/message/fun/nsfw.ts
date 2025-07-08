import { ChannelType, codeBlock } from "discord.js";
import { Nsfw } from "eternal-support";

import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const nsfwCommands: Precommand = {
  name: "nsfw",
  nameLocalizations: {
    "es-ES": "nsfw",
    "en-US": "nsfw",
  },
  description: "Get a random NSFW image from the specified category.",
  descriptionLocalizations: {
    "es-ES": "Obtén una imagen NSFW aleatoria de la categoría especificada.",
    "en-US": "Get a random NSFW image from the specified category.",
  },
  examples: [
    "nsfw hentai",
    "nsfw maid",
    "nsfw panties",
    "nsfw wallpapers",
    "nsfw mobileWallpapers",
    "nsfw gif",
    "nsfw foxgirl",
    "nsfw school",
    "nsfw succubus",
  ],
  category: "Entertainment",
  nsfw: true,
  owner: false,
  cooldown: 5,
  aliases: ["nsfwimage"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  subcommands: [
    "doujin",
    "hentai",
    "maid",
    "panties",
    "wallpapers",
    "mobileWallpapers",
    "gif",
    "foxgirl",
    "school",
    "succubus",
  ],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild?.preferredLocale || "es-ES";
    const subcommands = args[0];
    const types = [
      "doujin",
      "hentai",
      "maid",
      "panties",
      "wallpapers",
      "mobileWallpapers",
      "gif",
      "foxgirl",
      "school",
      "succubus",
    ];

    if (!subcommands)
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:nsfw.noSubcommand", { lng: lang })}`,
              `> **${client.t("discord:nsfw.subcommands", { lng: lang })}**\n`,
              `${codeBlock("asciidoc", types.join("\n"))}`,
            ].join("\n"),
          ),
        ],
      });

    if (!types.includes(subcommands))
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:nsfw.invalidSubcommand", { subcommand: subcommands, lng: lang })}`,
              `> **${client.t("discord:nsfw.subcommands", { lng: lang })}**\n`,
              `${codeBlock("asciidoc", types.join("\n"))}`,
            ].join("\n"),
          ),
        ],
      });

    const subcommand_nsfw = subcommands as keyof typeof Nsfw;
    const image = await Nsfw[subcommand_nsfw]();
    if (!image)
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:nsfw.noImage", { subcommand: subcommands, lng: lang })}`,
              client.t("discord:nsfw.tryAgain", { lng: lang }),
            ].join("\n"),
          ),
        ],
      });

    const embed = new EmbedCorrect()
      .setTitle(client.t("discord:nsfw.title", { lng: lang }))
      .setImage(image)
      .setColor("Random");
    return message.channel.send({ embeds: [embed] });
  },
};
export = nsfwCommands;
