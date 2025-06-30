import { stripIndent } from "common-tags";
import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder,
	Message, ModalSubmitInteraction, PermissionResolvable, StringSelectMenuBuilder,
	StringSelectMenuInteraction
} from "discord.js";
import { readdirSync, statSync } from "fs";
import { join } from "path";

import { MyDiscord } from "@/interfaces/messaging/modules/discord/client";
import { Precommand } from "@typings/modules/discord";
import { config } from "@utils/config";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

import packages from "../../../../../../../../../package.json";

/**
 * Genera el objeto de footer para los embeds de paginación del menú de ayuda.
 * @param page Página actual (1-indexed)
 * @param totalPages Total de páginas
 * @param prefix Prefijo del bot
 * @param iconURL URL del icono a mostrar en el footer
 */
function getPageFooter(page: number, totalPages: number, prefix: string, iconURL?: string, t?: any) {
  return {
    text: t
      ? t("help.pageFooter", { page, totalPages, prefix })
      : `Página ${page}/${totalPages} • Usa ${prefix}help <comando> para más info`,
    iconURL: iconURL,
  };
}

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

function createCommandEmbed(command: Precommand, prefix: string, client: MyDiscord, message: Message) {
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

/* const SUPPORTED_LANGUAGES = [
  { label: "Español", value: "es", emoji: "🇪🇸" },
  { label: "English", value: "en", emoji: "🇬🇧" },
  // Puedes agregar más idiomas aquí
];
 */

const helpCommand: Precommand = {
  name: "help",
  description: "View the help menu with all bot commands and information",
  examples: ["help", "help <command>", "help <category>", "help search <query>"],
  nsfw: false,
  cooldown: 5,
  category: "Information",
  owner: false,
  aliases: ["h", "commands", "command", "cmds"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client: MyDiscord, message: Message, args: string[], prefix: string) {
    const categories = readdirSync(
      config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands,
    );
    const isOwner = config.modules.discord.owners.includes(message.author.id);

    if (!message.guild || !client.user) return;

    const t = client.translations.getFixedT(message.guild?.preferredLocale || "es-ES", "discord");

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
              .setTitle(t("help.noResultsTitle"))
              .setDescription(t("help.noResultsDesc", { query })),
          ],
        });
      }

      const searchEmbed = new EmbedBuilder()
        .setTitle(t("help.searchResultsTitle", { query }))
        .setColor("#7289DA")
        .setDescription(t("help.searchResultsDesc", { count: matchedCommands.length }))
        .addFields({
          name: t("help.commands"),
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
          text: t("help.showingResults", { shown: 10, total: matchedCommands.length }),
        });
      }

      const searchRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("open_search_modal")
          .setLabel(t("help.advancedSearch"))
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
          `${config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands}${category}`,
        );

        const categoryEmbed = new EmbedBuilder()
          .setTitle(t("help.categoryTitle", { category }))
          .setColor("#5865F2")
          .setDescription(
            categoryCommands.length > 0
              ? t("help.categoryDesc", { count: categoryCommands.length }) +
                  "\n" +
                  categoryCommands.map((cmd) => `• \`${cmd}\``).join("\n")
              : t("help.noCommandsInCategory"),
          )
          .setFooter({
            text: t("help.categoryFooter", { prefix }),
          });

        return message.reply({ embeds: [categoryEmbed] });
      } else {
        return message.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle(t("help.notFoundTitle"))
              .setDescription(
                t("help.notFoundDesc", { arg: args[0], prefix }),
              ),
          ],
        });
      }
    }

    // --- FILTROS DE PERMISOS Y NSFW ---
    let filterPermissions: string[] = [];
    let filterNSFW: boolean | null = null;

    // Analizar argumentos para filtros
    args.forEach((arg) => {
      if (arg.toLowerCase() === "nsfw") filterNSFW = true;
      if (arg.toLowerCase() === "sfw") filterNSFW = false;
      // Ejemplo: "perm:ManageMessages"
      if (arg.toLowerCase().startsWith("perm:")) {
        const perm = arg.split(":")[1];
        if (perm) filterPermissions.push(perm);
      }
    });

    // Main help menu
    let currentPage = 0;

    // --- SELECTOR DE IDIOMA ---
/*     const languageSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help_language_select")
        .setPlaceholder(t("help.languageSelectPlaceholder"))
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(SUPPORTED_LANGUAGES),
    ); */

    // --- FILTRO DE COMANDOS ---
    // Filtrar comandos por permisos y NSFW si corresponde
    /*     const filteredPrecommands = (Array.from(client.precommands.values()) as Precommand[]).filter(
      (cmd) => {
        if (
          filterPermissions.length > 0 &&
          (!cmd.permissions || !filterPermissions.every((p) => cmd.permissions?.includes(p as PermissionResolvable)))
        ) {
          return false;
        }
        if (filterNSFW !== null && cmd.nsfw !== filterNSFW) {
          return false;
        }
        return true;
      },
    ); */

    // Crear mainEmbed y categoryEmbeds usando filteredPrecommands si hay filtros activos
    // Si no hay filtros, usar todos los comandos como antes
    const mainEmbed = new EmbedBuilder()
      .setAuthor({
        name: t("help.menuTitle", { username: client.user.username }),
        iconURL: client.user.displayAvatarURL(),
      })
      .setThumbnail(client.user.displayAvatarURL())
      .setColor("#5865F2")
      .setDescription(
        stripIndent`
                **${t("help.welcome", { username: client.user.username })}**
                
                ${t("help.menuDesc")}
            `,
      )
      .addFields(
        {
          name: t("help.botStats"),
          value: stripIndent`
                        • **${t("help.servers")}:** ${client.guilds.cache.size}
                        • **${t("help.commands")}:** ${client.precommands.size}
                        • **${t("help.categories")}:** ${categories.length}
                        • **${t("help.ping")}:** ${client.ws.ping}ms
                    `,
          inline: true,
        },
        {
          name: t("help.botInfo"),
          value: stripIndent`
                        • **${t("help.version")}:** ${packages.version}
                        • **Node.js:** ${process.version}
                        • **${t("help.memory")}:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
                        • **${t("help.uptime")}:** ${client.uptime ? `${Math.floor(client.uptime / 86400000)}d ${Math.floor(client.uptime / 3600000) % 24}h` : "N/A"}
                    `,
          inline: true,
        },
      )
      .setFooter(
        getPageFooter(1, categories.length + 1, prefix, message.guild.iconURL({ forceStatic: true }) as string, t),
      )
      .setTitle(t("help.pageTitle", { page: 1, total: categories.length + 1 }));

    // Crear categoryEmbeds
    const categoryEmbeds = categories.map((category, index) => {
      // Filtrar comandos de la categoría si hay filtros activos
      let commands = getCommandsFromFolder(
        `${config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands}${category}`,
      );
      if (filterPermissions.length > 0 || filterNSFW !== null) {
        commands = commands.filter((cmdName) => {
          const cmdObj = client.precommands.get(cmdName) as Precommand;
          if (!cmdObj) return false;
          if (
            filterPermissions.length > 0 &&
            (!cmdObj.permissions ||
              !filterPermissions.every((p) => cmdObj.permissions?.includes(p as PermissionResolvable)))
          ) {
            return false;
          }
          if (filterNSFW !== null && cmdObj.nsfw !== filterNSFW) {
            return false;
          }
          return true;
        });
      }
      return new EmbedBuilder()
        .setTitle(t("help.categoryPageTitle", { page: index + 2, total: categories.length + 1, category }))
        .setColor("#5865F2")
        .setDescription(
          commands.length > 0
            ? t("help.categoryDesc", { count: commands.length }) + "\n" + commands.map((cmd) => `• \`${cmd}\``).join("\n")
            : t("help.noCommandsInCategory"),
        )
        .setFooter(
          getPageFooter(
            index + 2,
            categories.length + 1,
            prefix,
            message.guild?.iconURL({ forceStatic: true }) as string,
            t,
          ),
        );
    });

    const allEmbeds = [mainEmbed, ...categoryEmbeds];

    // Create category select menu
    const categorySelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help_category_select")
        .setPlaceholder(t("help.categorySelectPlaceholder"))
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          categories.map((category) => ({
            label: category,
            value: category,
            description: t("help.categoryOptionDesc", {
              count: getCommandsFromFolder(`${config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands}${category}`).length,
            }),
            emoji: "📁",
          })),
        ),
    );

    // Create navigation buttons
    const navButtonsRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("help_prev").setLabel(t("help.prev")).setStyle(ButtonStyle.Secondary).setEmoji("⬅️"),
      new ButtonBuilder().setCustomId("help_home").setLabel(t("help.home")).setStyle(ButtonStyle.Primary).setEmoji("🏠"),
      new ButtonBuilder().setCustomId("help_next").setLabel(t("help.next")).setStyle(ButtonStyle.Secondary).setEmoji("➡️"),
      new ButtonBuilder().setCustomId("help_jump").setLabel(t("help.jump")).setStyle(ButtonStyle.Secondary).setEmoji("🔢"),
      new ButtonBuilder().setCustomId("help_search").setLabel(t("help.search")).setStyle(ButtonStyle.Success).setEmoji("🔍"),
    );

    const navButtonsRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("owner_tools_menu")
        .setLabel(t("help.owner"))
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⚙️")
        .setDisabled(!isOwner),
      new ButtonBuilder().setCustomId("help_close").setLabel(t("help.close")).setStyle(ButtonStyle.Danger).setEmoji("❌"),
    );

    // Send the initial message with conditional components
    const components = isOwner
      ? [categorySelect, navButtonsRow1, navButtonsRow2]
      : [categorySelect, navButtonsRow1, navButtonsRow2];

    const helpMessage = await message.reply({
      embeds: [allEmbeds[currentPage]],
      components: [...components],
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

    // Modal collector para saltar a página
    const modalCollector = helpMessage.channel?.createMessageComponentCollector({
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
                ? [categorySelect, navButtonsRow1, navButtonsRow2]
                : [categorySelect, navButtonsRow1, navButtonsRow2],
            });
            break;

          case "help_home":
            currentPage = 0;
            await interaction.editReply({
              embeds: [allEmbeds[currentPage]],
              components: isOwner
                ? [categorySelect, navButtonsRow1, navButtonsRow2]
                : [categorySelect, navButtonsRow1, navButtonsRow2],
            });
            break;

          case "help_next":
            currentPage = currentPage < allEmbeds.length - 1 ? currentPage + 1 : 0;
            await interaction.editReply({
              embeds: [allEmbeds[currentPage]],
              components: isOwner
                ? [categorySelect, navButtonsRow1, navButtonsRow2]
                : [categorySelect, navButtonsRow1, navButtonsRow2],
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
                content: t("help.noPermission"),
                flags: "Ephemeral",
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
              content: t("help.ownerToolsMenu"),
              components: [ownerToolsMenu],
              flags: "Ephemeral",
            });
            break;
        }
      } catch (error) {
        console.error("Error in button interaction:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .followUp({
              content: "❌ An error occurred while processing your request.",
              flags: "Ephemeral",
            })
            .catch(() => {});
        }
      }
    });

    // Modal submit handler para saltar a página
    if (modalCollector) {
      modalCollector.on("collect", async (modalInteraction: ModalSubmitInteraction) => {
        if (modalInteraction.customId === "help_jump_modal") {
          const value = modalInteraction.fields.getTextInputValue("page_number");
          const pageNum = parseInt(value, 10);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > allEmbeds.length) {
            await modalInteraction.reply({
              content: t("help.invalidPage", { total: allEmbeds.length }),
              flags: "Ephemeral",
            });
            return;
          }
          currentPage = pageNum - 1;
          await modalInteraction.reply({
            embeds: [allEmbeds[currentPage]],
            components: isOwner
              ? [categorySelect, navButtonsRow1, navButtonsRow2]
              : [categorySelect, navButtonsRow1, navButtonsRow2],
            ephemeral: false,
          });
        }
      });
    }

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
                ? [categorySelect, navButtonsRow1, navButtonsRow2]
                : [categorySelect, navButtonsRow1, navButtonsRow2],
            });
          }
        }


      } catch (error) {
        console.error("Error in select menu interaction:", error);
        await interaction
          .followUp({
            content: "❌ An error occurred while processing your request.",
            flags: "Ephemeral",
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
              .setDescription(t("help.menuExpired"))
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
