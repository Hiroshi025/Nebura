import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } from "discord.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Precommand } from "@typings/modules/discord";
import { ErrorEmbed } from "@utils/extends/embeds.extension";
import { logWithLabel } from "@utils/functions/console";

const pokedexCommand: Precommand = {
  name: "pokedex",
  nameLocalizations: {
    "es-ES": "pokedex",
    "en-US": "pokedex",
  },
  description: "Pokedex command can show you information about pokemon",
  descriptionLocalizations: {
    "es-ES": "El comando Pokédex puede mostrarte información sobre los Pokémon",
    "en-US": "The Pokédex command can show you information about Pokémon",
  },
  examples: ["pokedex <pokemon>"],
  nsfw: false,
  category: "Entertainment",
  owner: false,
  cooldown: 15,
  aliases: ["pokedex-search", "pokedex-pokemon", "pokedex-info", "pokemon"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  subcommands: ["pokedex info <name>"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild?.preferredLocale || "es-ES";
    const subcommand = args[0];
    switch (subcommand) {
      case "info":
        {
          try {
            const pokemon = args.slice(1).join(" ");
            if (!message.guild) return;
            if (!pokemon)
              return message.reply({
                content: [
                  `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:pokedex.noName", { lng: lang })}`,
                  client.t("discord:pokedex.usage", { prefix, lng: lang }),
                ].join("\n"),
              });

            const response = await getResponse(`https://pokeapi.glitch.me/v1/pokemon/${pokemon}`);
            if (response.status === 404) {
              message.channel.send({
                content: [
                  `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:pokedex.notFound", { pokemon, lng: lang })}`,
                  client.t("discord:pokedex.checkSpelling", { lng: lang }),
                ].join("\n"),
              });
            } else {
              if (!response.success) return;
              const json = response.data[0];
              if (!json) return;
              const name = json.name.toLowerCase();
              let hiddenAbilities = ` and ${json.abilities.hidden}.`;
              if (!json.abilities.hidden.length) {
                hiddenAbilities = ".";
              }
              let gender = json.gender;
              if (!json.gender.length) {
                gender = client.t("discord:pokedex.genderless", { lng: lang });
              }

              const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel("Bulbapedia")
                  .setURL(`https://bulbapedia.bulbagarden.net/wiki/${json.name}`)
                  .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                  .setLabel("Serebii")
                  .setURL(`https://www.serebii.net/pokedex-swsh/${json.name.toLowerCase()}`)
                  .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                  .setLabel("Smogon")
                  .setURL(`https://www.smogon.com/dex/ss/pokemon/${json.name.toLowerCase()}`)
                  .setStyle(ButtonStyle.Link),
              );

              await message.channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setAuthor({
                      name: `PokéDex: ${json.name}`,
                      iconURL: `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`,
                    })
                    .setColor("Random")
                    .setThumbnail(`https://play.pokemonshowdown.com/sprites/ani/${name}.gif`)
                    .addFields(
                      {
                        name: client.t("discord:pokedex.nationalNumber", { lng: lang }),
                        value: `${json.nationalNumber}`,
                        inline: true,
                      },
                      {
                        name: client.t("discord:pokedex.types", { lng: lang }),
                        value: `${json.types.join(", ")}`,
                        inline: true,
                      },
                      {
                        name: client.t("discord:pokedex.abilities", { lng: lang }),
                        value: `${json.abilities.normal}${hiddenAbilities}`,
                        inline: false,
                      },
                      {
                        name: client.t("discord:pokedex.genderRatio", { lng: lang }),
                        value: `${gender}`,
                        inline: false,
                      },
                      {
                        name: client.t("discord:pokedex.heightWeight", { lng: lang }),
                        value: `${json.height} foot tall\n${json.weight}`,
                        inline: true,
                      },
                      {
                        name: client.t("discord:pokedex.evolutionLine", { lng: lang }),
                        value: `${json.family.evolutionLine.join(", ")}\n${client.t("discord:pokedex.currentStage", { stage: json.family.evolutionStage, lng: lang })}`,
                        inline: true,
                      },
                      {
                        name: client.t("discord:pokedex.generation", { lng: lang }),
                        value: `${json.gen}`,
                        inline: false,
                      },
                      {
                        name: client.t("discord:pokedex.eggGroups", { lng: lang }),
                        value: `${json.eggGroups.join(", ")}`,
                        inline: false,
                      },
                      {
                        name: client.t("discord:pokedex.catchRate", { lng: lang }),
                        value: `${json.captureRate}`,
                        inline: false,
                      },
                    )
                    .setFooter({ text: json.description }),
                ],
                components: [button],
              });
            }
          } catch (err) {
            logWithLabel("error", `The following error occured: ${err}`);
            if (!message.guild) return;
            message.channel.send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:pokedex.errorTitle", { lng: lang }))
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:pokedex.error", { err, lng: lang })}`,
                      `**${client.t("discord:pokedex.example", { prefix, lng: lang })}**`,
                    ].join("\n"),
                  ),
              ],
            });
          }
        }
        break;
    }

    async function getResponse(url: string) {
      try {
        const res = await axios.get(url);
        return {
          success: true,
          status: res.status,
          data: res.data,
        };
      } catch (error: any) {
        return {
          success: false,
          status: error.response?.status,
          data: error.response?.data,
        };
      }
    }

    return;
  },
};

export = pokedexCommand;
