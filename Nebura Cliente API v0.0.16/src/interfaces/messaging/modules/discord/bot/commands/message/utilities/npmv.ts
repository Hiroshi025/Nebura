import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder,
	StringSelectMenuBuilder
} from "discord.js";

import { NPMPackage, Precommand } from "@typings/modules/discord";

const commandNpm: Precommand = {
  name: "npm-version",
  description: "Get detailed information about an NPM package",
  examples: ["npm-version <package-name>", "npm-version discord.js"],
  nsfw: false,
  owner: false,
  category: "Utilities",
  aliases: ["npmv", "npm-info", "npmpkg"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    if (!args[0]) {
      return message.reply({
        embeds: [
          {
            title: client.t("discord:npmv.errorTitle", { lng: message.guild.preferredLocale }),
            description: [
              `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:npmv.noPackage", { lng: message.guild.preferredLocale })}`,
              client.t("discord:npmv.usage", { prefix, command: this.name, lng: message.guild.preferredLocale }),
            ].join("\n"),
          },
        ],
      });
    }

    const packageName = args[0];
    let pkgData: NPMPackage;

    try {
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      pkgData = response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return message.reply({
          embeds: [
            {
              title: client.t("discord:npmv.errorTitle", { lng: message.guild.preferredLocale }),
              description: [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:npmv.notFound", { lng: message.guild.preferredLocale })}`,
                client.t("discord:npmv.checkName", { lng: message.guild.preferredLocale }),
              ].join("\n"),
            },
          ],
        });
      }
      console.error("Error fetching NPM package:", error);
      return message.reply({
        embeds: [
          {
            title: client.t("discord:npmv.errorTitle", { lng: message.guild.preferredLocale }),
            description: [
              `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:npmv.fetchError", { lng: message.guild.preferredLocale })}`,
              client.t("discord:npmv.tryAgain", { lng: message.guild.preferredLocale }),
            ].join("\n"),
          },
        ],
      });
    }

    // Main embed with basic info
    const mainEmbed = new EmbedBuilder()
      .setTitle(client.t("discord:npmv.title", { name: pkgData.name, lng: message.guild.preferredLocale }))
      .setColor(0xcb3837)
      .setDescription(
        pkgData.description || client.t("discord:npmv.noDescription", { lng: message.guild.preferredLocale }),
      )
      .addFields(
        {
          name: client.t("discord:npmv.latestVersion", { lng: message.guild.preferredLocale }),
          value:
            pkgData["dist-tags"]?.latest || client.t("discord:npmv.unknown", { lng: message.guild.preferredLocale }),
          inline: true,
        },
        {
          name: client.t("discord:npmv.license", { lng: message.guild.preferredLocale }),
          value:
            typeof pkgData.license === "string"
              ? pkgData.license
              : client.t("discord:npmv.unknown", { lng: message.guild.preferredLocale }),
          inline: true,
        },
        {
          name: client.t("discord:npmv.author", { lng: message.guild.preferredLocale }),
          value:
            typeof pkgData.author === "object"
              ? pkgData.author.name
              : pkgData.author || client.t("discord:npmv.unknown", { lng: message.guild.preferredLocale }),
          inline: true,
        },
      );

    // Add repository info if available
    if (pkgData.repository) {
      let repoUrl = "";
      if (typeof pkgData.repository === "string") {
        repoUrl = pkgData.repository;
      } else if (pkgData.repository.url) {
        repoUrl = pkgData.repository.url.replace("git+", "").replace(".git", "");
      }
      mainEmbed.addFields({
        name: client.t("discord:npmv.repository", { lng: message.guild.preferredLocale }),
        value: `[${client.t("discord:npmv.viewOnGitHub", { lng: message.guild.preferredLocale })}](${repoUrl})`,
        inline: true,
      });
    }

    // Add homepage if available
    if (pkgData.homepage) {
      mainEmbed.addFields({
        name: client.t("discord:npmv.homepage", { lng: message.guild.preferredLocale }),
        value: `[${client.t("discord:npmv.visitWebsite", { lng: message.guild.preferredLocale })}](${pkgData.homepage})`,
        inline: true,
      });
    }

    // Add bugs if available
    if (pkgData.bugs) {
      let bugsUrl = "";
      if (typeof pkgData.bugs === "string") {
        bugsUrl = pkgData.bugs;
      } else if (pkgData.bugs.url) {
        bugsUrl = pkgData.bugs.url;
      }
      mainEmbed.addFields({
        name: client.t("discord:npmv.issueTracker", { lng: message.guild.preferredLocale }),
        value: `[${client.t("discord:npmv.reportIssues", { lng: message.guild.preferredLocale })}](${bugsUrl})`,
        inline: true,
      });
    }

    // Create buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(client.t("discord:npmv.viewOnNpm", { lng: message.guild.preferredLocale }))
        .setURL(`https://www.npmjs.com/package/${pkgData.name}`)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel(client.t("discord:npmv.viewDependencies", { lng: message.guild.preferredLocale }))
        .setCustomId("view_deps")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel(client.t("discord:npmv.viewVersions", { lng: message.guild.preferredLocale }))
        .setCustomId("view_versions")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel(client.t("discord:npmv.viewReadme", { lng: message.guild.preferredLocale }))
        .setCustomId("view_readme")
        .setStyle(ButtonStyle.Secondary),
    );

    if (!message.guild) return;

    // Create versions select menu
    const versions = Object.keys(pkgData.versions || {})
      .reverse()
      .slice(0, 25);
    const versionSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_version")
        .setPlaceholder(client.t("discord:npmv.selectVersion", { lng: message.guild.preferredLocale }))
        .addOptions(
          versions.map((version) => ({
            label: version,
            value: version,
            description: client.t("discord:npmv.releasedOn", {
              date:
                pkgData.time?.[version] || client.t("discord:npmv.unknownDate", { lng: message.guild?.preferredLocale }),
              lng: message.guild?.preferredLocale,
            }),
            default: version === pkgData["dist-tags"]?.latest,
          })),
        ),
    );

    // Send initial message
    const msg = await message.reply({
      embeds: [mainEmbed],
      components: [buttons, versionSelect],
    });

    // Collector for interactions
    const collector = msg.createMessageComponentCollector({
      time: 60000, // 1 minute
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.deferUpdate();

      switch (interaction.customId) {
        case "view_deps": {
          const dependencies = pkgData.dependencies || {};
          const devDependencies = pkgData.devDependencies || {};

          const depsEmbed = new EmbedBuilder()
            .setTitle(
              client.t("discord:npmv.dependenciesTitle", { name: pkgData.name, lng: message.guild?.preferredLocale }),
            )
            .setColor(0xcb3837);

          if (Object.keys(dependencies).length > 0) {
            depsEmbed.addFields({
              name: client.t("discord:npmv.prodDependencies", { lng: message.guild?.preferredLocale }),
              value: Object.entries(dependencies)
                .map(([name, version]) => `• ${name}: ${version}`)
                .join("\n"),
            });
          }

          if (Object.keys(devDependencies).length > 0) {
            depsEmbed.addFields({
              name: client.t("discord:npmv.devDependencies", { lng: message.guild?.preferredLocale }),
              value: Object.entries(devDependencies)
                .map(([name, version]) => `• ${name}: ${version}`)
                .join("\n"),
            });
          }

          if (Object.keys(dependencies).length === 0 && Object.keys(devDependencies).length === 0) {
            depsEmbed.setDescription(client.t("discord:npmv.noDependencies", { lng: message.guild?.preferredLocale }));
          }

          await interaction.editReply({ embeds: [mainEmbed, depsEmbed] });
          break;
        }

        case "view_versions": {
          const versionsEmbed = new EmbedBuilder()
            .setTitle(
              client.t("discord:npmv.versionsTitle", { name: pkgData.name, lng: message.guild?.preferredLocale }),
            )
            .setColor(0xcb3837)
            .setDescription(
              Object.entries(pkgData.time || {})
                .filter(([key]) => !key.startsWith("created") && !key.startsWith("modified"))
                .map(([version, date]) => `• ${version} - ${new Date(date).toLocaleDateString()}`)
                .join("\n")
                .slice(0, 2000),
            );

          await interaction.editReply({ embeds: [mainEmbed, versionsEmbed] });
          break;
        }

        case "view_readme": {
          const readmeText =
            pkgData.readme || client.t("discord:npmv.noReadme", { lng: message.guild?.preferredLocale });
          const readmeEmbed = new EmbedBuilder()
            .setTitle(client.t("discord:npmv.readmeTitle", { name: pkgData.name, lng: message.guild?.preferredLocale }))
            .setColor(0xcb3837)
            .setDescription(readmeText.length > 2000 ? `${readmeText.substring(0, 2000)}...` : readmeText);

          await interaction.editReply({ embeds: [mainEmbed, readmeEmbed] });
          break;
        }
      }
    });

    // Handle version selection
    const selectCollector = msg.createMessageComponentCollector({
      time: 60000,
      componentType: ComponentType.StringSelect,
    });

    selectCollector.on("collect", async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;

      await interaction.deferUpdate();

      const selectedVersion = interaction.values[0];
      const versionData = pkgData.versions?.[selectedVersion];

      if (!versionData) {
        return;
      }

      const versionEmbed = new EmbedBuilder()
        .setTitle(
          client.t("discord:npmv.versionTitle", {
            version: selectedVersion,
            name: pkgData.name,
            lng: message.guild?.preferredLocale,
          }),
        )
        .setColor(0xcb3837)
        .addFields(
          {
            name: client.t("discord:npmv.published", { lng: message.guild?.preferredLocale }),
            value:
              pkgData.time?.[selectedVersion] ||
              client.t("discord:npmv.unknown", { lng: message.guild?.preferredLocale }),
            inline: true,
          },
          {
            name: client.t("discord:npmv.dependencies", { lng: message.guild?.preferredLocale }),
            value: Object.keys(versionData.dependencies || {}).length.toString(),
            inline: true,
          },
          {
            name: client.t("discord:npmv.devDependencies", { lng: message.guild?.preferredLocale }),
            value: Object.keys(versionData.devDependencies || {}).length.toString(),
            inline: true,
          },
        );

      if (versionData.deprecated) {
        versionEmbed.addFields({
          name: client.t("discord:npmv.deprecationWarning", { lng: message.guild?.preferredLocale }),
          value: versionData.deprecated,
        });
      }

      await interaction.editReply({ embeds: [mainEmbed, versionEmbed] });
    });

    // Clean up when collector ends
    collector.on("end", () => {
      msg.edit({ components: [] }).catch(console.error);
    });

    selectCollector.on("end", () => {
      msg.edit({ components: [] }).catch(console.error);
    });

    return;
  },
};

export = commandNpm;
