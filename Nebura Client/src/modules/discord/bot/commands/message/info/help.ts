import { stripIndent } from "common-tags";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, userMention
} from "discord.js";
import { readdirSync, statSync } from "fs";
import { join } from "path";

import { Precommand } from "@/typings/discord";
/* eslint-disable @typescript-eslint/no-explicit-any */
import emojis from "@config/json/emojis.json";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { config } from "@utils/config";

import packages from "../../../../../../../package.json";

function getCommandsFromFolder(path: string): string[] {
  let commands: string[] = [];

  const files = readdirSync(path);
  for (const file of files) {
    const fullPath = join(path, file);
    if (statSync(fullPath).isDirectory()) {
      // If it's a folder, call the function recursively
      commands = commands.concat(getCommandsFromFolder(fullPath));
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      // If it's a .ts or .js file, add it to the commands list
      const name = file.replace(/\.(ts|js)/, "");
      commands.push(name);
    }
  }

  return commands;
}

const helpCommand: Precommand = {
  name: "help",
  description: "View the help menu of the bot",
  examples: ["help", "help <command>", "help <category>"],
  nsfw: false,
  owner: false,
  aliases: ["h", "commands"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client: any, message, args, prefix) {
    const categorias = readdirSync(config.modules.discord.configs.precommands);
    if (!message.guild) return;
    if (!client.user) return;
    if (args[0]) {
      const comando =
        client.precommands.get(args[0].toLowerCase()) ||
        client.precommands.find(
          (c: Precommand) => c.aliases && c.aliases.includes(args[0].toLowerCase()),
        );
      const categoria = categorias.find((categoria) =>
        categoria.toLowerCase().endsWith(args[0].toLowerCase()),
      );
      if (comando) {
        const embed = new EmbedCorrect()
          .setAuthor({
            name: `Command Information: ${comando.name}`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setFooter({
            text: `Version: ${packages.version} | Author: ${packages.author}`,
            iconURL: message.guild?.iconURL({ forceStatic: true }) as string,
          })
          .setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
          .setColor("Green");

        if (comando.description) embed.setDescription(`> ${comando.description}`);
        if (comando.category)
          embed.addFields([
            {
              name: `Category`,
              value: `> \`${comando.category}\``,
              inline: true,
            },
          ]);
        if (comando.cooldown)
          embed.addFields([
            {
              name: `Cooldown`,
              value: `> \`${comando.cooldown ? comando.cooldown : 3}s\``,
              inline: true,
            },
          ]);
        if (comando.subcommands)
          embed.addFields([
            {
              name: `List in subcommands`,
              value: `${comando.subcommands.map((subcommand: string) => `• \`${subcommand}\``).join("\n")}`,
            },
          ]);
        if (comando.usage)
          embed.addFields([
            {
              name: `Usage`,
              value: `\`${prefix}${comando.usage}\``,
            },
          ]);
        if (comando.examples)
          embed.addFields([
            {
              name: `Examples`,
              value: `${comando.examples.map((ejemplo: string) => `\`${prefix}${ejemplo}\``).join("\n")}`,
            },
          ]);
        if (comando.aliases && comando.aliases.length >= 1)
          embed.addFields([
            {
              name: `Aliases`,
              value: `${comando.aliases.map((alias: string) => `${alias}`).join(", ")}`,
            },
          ]);
        if (comando.permissions && comando.permissions.length >= 1)
          embed.addFields([
            {
              name: `Permissions`,
              value: `${comando.permissions
                .map((permission: string) => {
                  return `No.${comando.permissions.indexOf(permission) + 1} - \`${permission}\``;
                })
                .join("\n")}`,
              inline: true,
            },
          ]);

        if (comando.botpermissions && comando.botpermissions.length >= 1)
          embed.addFields([
            {
              name: `Bot Permissions`,
              value: `${comando.botpermissions
                .map((permission: any) => {
                  return `No.${comando.botpermissions.indexOf(permission) + 1} - \`${permission}\``;
                })
                .join("\n")}`,
              inline: true,
            },
          ]);

        return message.reply({ embeds: [embed] }).catch((e: Error) => {
          return message.reply({
            embeds: [
              new ErrorEmbed()
                .setTitle("Help Menu - Error")
                .setDescription(
                  [
                    `${emojis.error} An error occurred while sending the help menu to your DMs!`,
                    `**Solution:** Make sure you have DMs enabled and try again!`,
                  ].join("\n"),
                )
                .setErrorFormat((e as Error).message, (e as Error).stack as string),
            ],
          });
        });
      } else if (categoria) {
        const comandos_de_categoria = getCommandsFromFolder(
          `${config.modules.discord.configs.precommands}${categoria}`,
        );
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${categoria}`)
              .setColor("Random")
              .setDescription(
                comandos_de_categoria.length >= 1
                  ? `>>> *${comandos_de_categoria.map((comando): string => `\`${comando.replace(/\.(ts|js)/, "")}\``).join(" - ")}*`
                  : `>>> *There are no commands in this category yet!...*`,
              ),
          ],
        });
      } else {
        return message.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle("Help Menu - Error")
              .setDescription(
                [
                  `${emojis.error} **The specified command could not be found!**`,
                  `Use \`${prefix}help\` to view the commands and categories!`,
                ].join("\n"),
              ),
          ],
        });
      }
    } else {
      let paginaActual = 0;

      const ayuda_embed = new EmbedBuilder()
        .setAuthor({
          name: `Pixel Hub Client`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setFooter({
          text: `Version: ${packages.version} | Author: ${packages.author}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setFields(
          {
            name: "👋 Welcome to the Discord Client",
            value: [
              `Welcome to the help menu of our control client **${client.user.username}**!`,
            ].join("\n"),
            inline: false,
          },
          {
            name: "__**Client Information**__",
            value: stripIndent`
              **Developer:** ${config.modules.discord.owners.map((owner: string) => userMention(owner)).join(" - ")}
              **Ping to the API:** \`${client.ws.ping}ms\` 
              **Platform:** \`${process.platform}\`
              **Memory Usage:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`
              **Node.js Version:** \`${process.version}\`
            `,
            inline: true,
          },
        )
        .setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
        .setColor("Random")
        .setTimestamp();

      const embeds_pages = [ayuda_embed];
      categorias.map(async (categoria, index) => {
        const comandos_de_categoria = getCommandsFromFolder(
          `${config.modules.discord.configs.precommands}${categoria}`,
        );
        const embed = new EmbedBuilder()
          .setTitle(`${categoria}`)
          .setColor("Random")
          .setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
          .setDescription(
            comandos_de_categoria.length >= 1
              ? `>>> *${comandos_de_categoria.map((comando) => `\`${comando.replace(/\.(ts|js)/, "")}\``).join(" - ")}*`
              : `>>> ${emojis.error} *There are no commands in this category yet...*`,
          )
          .setFooter({
            text: `Páge ${index + 2} / ${categorias.length + 1}\n Version: ${packages.version} | Author: ${packages.author}`,
            iconURL: message.guild?.iconURL({ forceStatic: true }) as string,
          });
        embeds_pages.push(embed);
      });

      const seleccion = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`SelecciónMenuAyuda`)
          .setPlaceholder("Prefix (text) commands")
          .setMinValues(1)
          .addOptions(
            categorias.map((categoria) => {
              const objeto = {
                label: categoria,
                value: categoria,
                description: `There are ${readdirSync(`${config.modules.discord.configs.precommands}${categoria}`).length} commands in this category`,
              };
              return objeto;
            }),
          ),
      );

      const botones = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setEmoji(emojis.help.back)
          .setLabel("Back")
          .setCustomId("Back"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel("Home")
          .setEmoji(emojis.help.home)
          .setCustomId("Home"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setLabel("Forward")
          .setEmoji(emojis.help.forward)
          .setCustomId("Forward"),
      ]);

      const mensaje_ayuda = await message
        .reply({
          embeds: [ayuda_embed],
          components: [seleccion, botones],
        })
        .catch((e: any) => {
          console.log(e);
          return message.reply({
            content: [
              `${emojis.error} An error occurred while sending the help menu to your DMs!`,
              `**Solution:** Make sure you have DMs enabled and try again!`,
            ].join("\n"),
          });
        });

      const collector = mensaje_ayuda.createMessageComponentCollector({
        filter: (i: {
          isButton: () => any;
          isStringSelectMenu: () => any;
          user: any;
          message: { author: { id: any } };
        }) =>
          i.isButton() ||
          (i.isStringSelectMenu() && i.user && i.message.author.id == client.user?.id),
        time: 180e3,
      });

      collector.on(
        "collect",
        async (interaction: {
          isButton: () => any;
          user: { id: any };
          reply: (arg0: { content?: string; ephemeral: boolean; embeds?: never[] }) => Promise<any>;
          customId: any;
          deferUpdate: () => any;
          values: any;
        }) => {
          if (interaction.isButton()) {
            if (interaction.user.id !== message.author.id) {
              await interaction.reply({
                content: `${emojis.error} **You can not do that! Only ${message.author}** you can interact with the help menu`,
                ephemeral: true
              });
            }

            switch (interaction.customId) {
              case "Back":
                {
                  collector.resetTimer();
                  if (paginaActual !== 0) {
                    paginaActual -= 1;
                    await mensaje_ayuda
                      .edit({ embeds: [embeds_pages[paginaActual]] })
                      .catch(() => {});
                    await interaction?.deferUpdate();
                  } else {
                    paginaActual = embeds_pages.length - 1;
                    await mensaje_ayuda
                      .edit({ embeds: [embeds_pages[paginaActual]] })
                      .catch(() => {});
                    await interaction?.deferUpdate();
                  }
                }
                break;
              case "Home":
                {
                  collector.resetTimer();
                  paginaActual = 0;
                  await mensaje_ayuda
                    .edit({ embeds: [embeds_pages[paginaActual]] })
                    .catch(() => {});
                  await interaction?.deferUpdate();
                }
                break;

              case "Forward":
                {
                  collector.resetTimer();
                  if (paginaActual < embeds_pages.length - 1) {
                    paginaActual++;
                    await mensaje_ayuda
                      .edit({ embeds: [embeds_pages[paginaActual]] })
                      .catch(() => {});
                    await interaction?.deferUpdate();
                  } else {
                    paginaActual = 0;
                    await mensaje_ayuda
                      .edit({ embeds: [embeds_pages[paginaActual]] })
                      .catch(() => {});
                    await interaction?.deferUpdate();
                  }
                }
                break;

              default:
                break;
            }
          } else {
            const embeds: never[] = [];
            for (const seleccionado of interaction.values) {
              const comandos_de_categoria = getCommandsFromFolder(
                `${config.modules.discord.configs.precommands}${seleccionado}`,
              );
              const embed = new EmbedBuilder()
                .setTitle(`${seleccionado}`)
                .setColor("Random")
                .setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
                .setDescription(
                  comandos_de_categoria.length >= 1
                    ? `>>> *${comandos_de_categoria.map((comando) => `\`${comando.replace(/\.(ts|js)/, "")}\``).join(" - ")}*`
                    : `>>> ${emojis.error} *There are no commands in this category yet, come back later*`,
                )
                .setFooter({
                  text: `Version: ${packages.version} | Author: ${packages.author}`,
                  iconURL: message.guild?.iconURL({
                    forceStatic: true,
                  }) as string,
                });

              embeds.push(embed as never);
            }
            interaction.reply({ embeds, ephemeral: true }).catch(() => {
              return message.reply({
                content: [
                  `${emojis.error} An error occurred while sending the help menu to your DMs!`,
                  `**Solution:** Make sure you have DMs enabled and try again!`,
                ].join("\n"),
              });
            });
          }
        },
      );

      collector.on("end", () => {
        mensaje_ayuda
          .edit({
            content: `${emojis.error} Oops your time has expired! Type \`help\` again to see it again!`,
            components: [],
          })
          .catch((e: Error) => {
            return message.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Help Menu - Error")
                  .setDescription(
                    [
                      `${emojis.error} An error occurred while sending the help menu to your DMs!`,
                      `**Solution:** Make sure you have DMs enabled and try again!`,
                    ].join("\n"),
                  )
                  .setErrorFormat((e as Error).message, (e as Error).stack as string),
              ],
            });
          });
      });
    }

    return;
  },
};

export = helpCommand;
