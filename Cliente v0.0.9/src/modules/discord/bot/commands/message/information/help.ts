import { stripIndent } from "common-tags";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { readdirSync, statSync } from "fs";
import { join } from "path";

import { MyClient } from "@/modules/discord/client";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extend";
import { Precommand } from "@typings/modules/discord";
import { config } from "@utils/config";

import packages from "../../../../../../../package.json";

function getCommandsFromFolder(path: string): string[] {
  let commands: string[] = [];
  try {
    const files = readdirSync(path);

    for (const file of files) {
      const fullPath = join(path, file);
      if (statSync(fullPath).isDirectory()) {
        commands = commands.concat(getCommandsFromFolder(fullPath));
      } else if (file.endsWith(".ts") || file.endsWith(".js")) {
        const name = file.replace(/\.(ts|js)/, "");
        commands.push(name);
      }
    }
  } catch (error) {
    console.error(`Error reading commands from folder ${path}:`, error);
  }
  return commands;
}

function createCommandEmbed(
  command: Precommand,
  prefix: string,
  client: MyClient,
  message: Message,
) {
  const embed = new EmbedCorrect()
    .setAuthor({
      name: `Command: ${command.name}`,
      iconURL: client.user?.displayAvatarURL(),
    })
    .setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
    .setColor("#4B0082")
    .setFooter({
      text: `Version ${packages.version}`,
      iconURL: message.guild?.iconURL({ forceStatic: true }) as string,
    });

  embed.setDescription(command.description || "No description provided");

  let usageText = `\`${prefix}${command.name}\``;
  if (command.usage) usageText += ` or \`${prefix}${command.usage}\``;
  if (command.examples) {
    usageText += `\n\n**Examples:**\n${command.examples.map((e) => `\`${prefix}${e}\``).join("\n")}`;
  }

  embed.addFields({ name: "Usage", value: usageText });

  if (command.aliases?.length) {
    embed.addFields({
      name: "Aliases",
      value: command.aliases.map((a) => `\`${a}\``).join(", "),
      inline: true,
    });
  }

  if (command.cooldown) {
    embed.addFields({
      name: "Cooldown",
      value: `${command.cooldown}s`,
      inline: true,
    });
  }

  if (command.subcommands?.length) {
    embed.addFields({
      name: "Subcommands",
      value: command.subcommands.map((s) => `• \`${s}\``).join("\n"),
      inline: true,
    });
  }

  if (command.permissions?.length) {
    embed.addFields({
      name: "Required Permissions",
      value: command.permissions.map((p) => `• ${p}`).join("\n"),
      inline: true,
    });
  }

  if (command.botpermissions?.length) {
    embed.addFields({
      name: "Bot Permissions",
      value: command.botpermissions.map((p) => `• ${p}`).join("\n"),
      inline: true,
    });
  }

  const metadata = [];
  if (command.nsfw) metadata.push("🔞 NSFW");
  if (command.owner) metadata.push("👑 Owner Only");

  if (metadata.length) {
    embed.addFields({
      name: "Metadata",
      value: metadata.join(" • "),
      inline: false,
    });
  }

  return embed;
}

const helpCommand: Precommand = {
  name: "help",
  description: "View the help menu with all bot commands and information",
  examples: ["help", "help <command>", "help <category>", "help search <query>"],
  nsfw: false,
  owner: false,
  aliases: ["h", "commands", "command", "cmds"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client: MyClient, message: Message, args: string[], prefix: string) {
    const categories = readdirSync(config.modules.discord.configs.precommands);
    const isOwner = config.modules.discord.owners.includes(message.author.id);

    if (!message.guild || !client.user) return;

    // Handle search functionality
    if (args[0]?.toLowerCase() === "search" && args[1]) {
      const query = args.slice(1).join(" ").toLowerCase();
      const allCommands = Array.from(client.precommands.values());

      const matchedCommands = allCommands.filter(
        (cmd) =>
          (cmd as Precommand).name.toLowerCase().includes(query) ||
          (cmd as Precommand).aliases?.some((a) => a.toLowerCase().includes(query)) ||
          (cmd as Precommand).description.toLowerCase().includes(query),
      );

      if (matchedCommands.length === 0) {
        return message.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle("No Results Found")
              .setDescription(`No commands found matching \`${query}\``),
          ],
        });
      }

      const searchEmbed = new EmbedBuilder()
        .setTitle(`Search Results for "${query}"`)
        .setColor("#7289DA")
        .setDescription(`Found ${matchedCommands.length} matching commands`)
        .addFields({
          name: "Commands",
          value: matchedCommands
            .slice(0, 10)
            .map(
              (cmd) =>
                `• \`${(cmd as Precommand).name}\` - ${(cmd as Precommand).description.substring(0, 50)}${(cmd as Precommand).description.length > 50 ? "..." : ""}`,
            )
            .join("\n"),
        });

      if (matchedCommands.length > 10) {
        searchEmbed.setFooter({
          text: `Showing 10 of ${matchedCommands.length} results. Use the search modal for more precise results.`,
        });
      }

      const searchRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("open_search_modal")
          .setLabel("Advanced Search")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🔍"),
      );

      return message.reply({
        embeds: [searchEmbed],
        components: [searchRow],
      });
    }

    // Handle specific command or category request
    if (args[0]) {
      const command =
        client.precommands.get(args[0].toLowerCase()) ||
        Array.from(client.precommands.values()).find((cmd) =>
          (cmd as Precommand).aliases?.includes(args[0].toLowerCase()),
        );

      const category = categories.find((cat) => cat.toLowerCase().endsWith(args[0].toLowerCase()));

      if (command) {
        return message.reply({
          embeds: [createCommandEmbed(command as Precommand, prefix, client, message)],
        });
      } else if (category) {
        const categoryCommands = getCommandsFromFolder(
          `${config.modules.discord.configs.precommands}${category}`,
        );

        const categoryEmbed = new EmbedBuilder()
          .setTitle(`Category: ${category}`)
          .setColor("#5865F2")
          .setDescription(
            categoryCommands.length > 0
              ? `**${categoryCommands.length} commands available:**\n` +
                  categoryCommands.map((cmd) => `• \`${cmd}\``).join("\n")
              : "No commands in this category yet",
          )
          .setFooter({
            text: `Use ${prefix}help <command> for more info`,
          });

        return message.reply({ embeds: [categoryEmbed] });
      } else {
        return message.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle("Not Found")
              .setDescription(
                `No command or category named \`${args[0]}\` found.\n` +
                  `Try \`${prefix}help search ${args[0]}\` to search for similar commands.`,
              ),
          ],
        });
      }
    }

    // Main help menu
    let currentPage = 0;

    // Create main help embed
    const mainEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${client.user.username} Help Menu`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setThumbnail(client.user.displayAvatarURL())
      .setColor("#5865F2")
      .setDescription(
        stripIndent`
                **Welcome to ${client.user.username}'s help menu!**
                
                Here you can find all available commands and information about the bot.
                Use the buttons below to navigate or select a category from the dropdown.
            `,
      )
      .addFields(
        {
          name: "📊 Bot Stats",
          value: stripIndent`
                        • **Servers:** ${client.guilds.cache.size}
                        • **Commands:** ${client.precommands.size}
                        • **Categories:** ${categories.length}
                        • **Ping:** ${client.ws.ping}ms
                    `,
          inline: true,
        },
        {
          name: "ℹ️ Bot Info",
          value: stripIndent`
                        • **Version:** ${packages.version}
                        • **Node.js:** ${process.version}
                        • **Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
                        • **Uptime:** ${client.uptime ? `${Math.floor(client.uptime / 86400000)}d ${Math.floor(client.uptime / 3600000) % 24}h` : "N/A"}
                    `,
          inline: true,
        },
      )
      .setFooter({
        text: `Page 1/${categories.length + 1} | ${prefix}help <command> for details`,
        iconURL: message.guild.iconURL({ forceStatic: true }) as string,
      });

    // Create category embeds
    const categoryEmbeds = categories.map((category, index) => {
      const commands = getCommandsFromFolder(
        `${config.modules.discord.configs.precommands}${category}`,
      );

      return new EmbedBuilder()
        .setTitle(`📁 ${category} Commands`)
        .setColor("#5865F2")
        .setDescription(
          commands.length > 0
            ? `**${commands.length} commands available:**\n` +
                commands.map((cmd) => `• \`${cmd}\``).join("\n")
            : "No commands in this category yet",
        )
        .setFooter({
          text: `Page ${index + 2}/${categories.length + 1} | ${prefix}help <command> for details`,
          iconURL: message.guild?.iconURL({ forceStatic: true }) as string,
        });
    });

    const allEmbeds = [mainEmbed, ...categoryEmbeds];

    // Create category select menu
    const categorySelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help_category_select")
        .setPlaceholder("Select a category...")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          categories.map((category) => ({
            label: category,
            value: category,
            description: `${getCommandsFromFolder(`${config.modules.discord.configs.precommands}${category}`).length} commands`,
            emoji: "📁",
          })),
        ),
    );

    // Create navigation buttons
    const navButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("help_prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⬅️"),
      new ButtonBuilder()
        .setCustomId("help_home")
        .setLabel("Home")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🏠"),
      new ButtonBuilder()
        .setCustomId("help_next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("➡️"),
      new ButtonBuilder()
        .setCustomId("help_search")
        .setLabel("Search")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔍"),
      new ButtonBuilder()
        .setCustomId("help_close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌"),
    );

    // Owner tools button (only visible to owners)
    const ownerToolsButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("owner_tools_menu")
        .setLabel("Owner Tools")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⚙️")
        .setDisabled(!isOwner),
    );

    // Send the initial message with conditional components
    const components = isOwner
      ? [categorySelect, navButtons, ownerToolsButton]
      : [categorySelect, navButtons];

    const helpMessage = await message.reply({
      embeds: [allEmbeds[currentPage]],
      components,
    });

    // Create collectors for each type of interaction
    const buttonCollector = helpMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === message.author.id,
      time: 300000,
    });

    const selectMenuCollector = helpMessage.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === message.author.id,
      time: 300000,
    });

    // Button interactions handler
    buttonCollector.on("collect", async (interaction: ButtonInteraction) => {
      try {
        // Verificar si la interacción ya fue reconocida
        if (interaction.replied || interaction.deferred) {
          console.warn("Interaction already acknowledged, skipping...");
          return;
        }

        // Reconocer la interacción
        await interaction.deferUpdate();

        switch (interaction.customId) {
          case "help_prev":
            currentPage = currentPage > 0 ? currentPage - 1 : allEmbeds.length - 1;
            await interaction.editReply({
              embeds: [allEmbeds[currentPage]],
              components: isOwner
                ? [categorySelect, navButtons, ownerToolsButton]
                : [categorySelect, navButtons],
            });
            break;

          case "help_home":
            currentPage = 0;
            await interaction.editReply({
              embeds: [allEmbeds[currentPage]],
              components: isOwner
                ? [categorySelect, navButtons, ownerToolsButton]
                : [categorySelect, navButtons],
            });
            break;

          case "help_next":
            currentPage = currentPage < allEmbeds.length - 1 ? currentPage + 1 : 0;
            await interaction.editReply({
              embeds: [allEmbeds[currentPage]],
              components: isOwner
                ? [categorySelect, navButtons, ownerToolsButton]
                : [categorySelect, navButtons],
            });
            break;

          case "help_close":
            buttonCollector.stop();
            selectMenuCollector.stop();
            await interaction.message.delete().catch(() => {});
            break;

          case "owner_tools_menu":
            if (!isOwner) {
              await interaction.followUp({
                content: "You don't have permission to use this!",
                ephemeral: true,
              });
              return;
            }

            // Crear menú de herramientas para el propietario
            const ownerToolsMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("owner_tools_select")
                .setPlaceholder("Select an action...")
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions([
                  {
                    label: "Reload Command",
                    value: "reload_command",
                    description: "Reload a specific command",
                    emoji: "🔄",
                  },
                  {
                    label: "Reload All Commands",
                    value: "reload_all",
                    description: "Reload all commands",
                    emoji: "🔁",
                  },
                  {
                    label: "Delete Command",
                    value: "delete_command",
                    description: "Delete a command file",
                    emoji: "🗑️",
                  },
                  {
                    label: "Download Command",
                    value: "download_command",
                    description: "Download a command file",
                    emoji: "📥",
                  },
                  {
                    label: "Cancel",
                    value: "cancel",
                    description: "Close this menu",
                    emoji: "❌",
                  },
                ]),
            );

            await interaction.followUp({
              content: "Owner Tools Menu",
              components: [ownerToolsMenu],
              ephemeral: true,
            });
            break;
        }
      } catch (error) {
        console.error("Error in button interaction:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .followUp({
              content: "❌ An error occurred while processing your request.",
              ephemeral: true,
            })
            .catch(() => {});
        }
      }
    });

    // Select menu interactions handler
    selectMenuCollector.on("collect", async (interaction: StringSelectMenuInteraction) => {
      try {
        await interaction.deferUpdate();

        if (interaction.customId === "help_category_select") {
          const selectedCategory = interaction.values[0];
          const categoryIndex = categories.findIndex((cat) => cat === selectedCategory);

          if (categoryIndex !== -1) {
            currentPage = categoryIndex + 1;
            await interaction.editReply({
              embeds: [allEmbeds[currentPage]],
              components: isOwner
                ? [categorySelect, navButtons, ownerToolsButton]
                : [categorySelect, navButtons],
            });
          }
        }
      } catch (error) {
        console.error("Error in select menu interaction:", error);
        await interaction
          .followUp({
            content: "❌ An error occurred while processing your request.",
            ephemeral: true,
          })
          .catch(() => {});
      }
    });

    // Cleanup when collectors end
    const cleanup = () => {
      if (!helpMessage.deletable) return;

      helpMessage
        .edit({
          components: [],
          embeds: [
            new EmbedBuilder()
              .setDescription("Help menu timed out. Use the help command again if needed.")
              .setColor("#808080"),
          ],
        })
        .catch(() => {});
    };

    buttonCollector.on("end", cleanup);
    selectMenuCollector.on("end", cleanup);
    return;
  },
};

export = helpCommand;
