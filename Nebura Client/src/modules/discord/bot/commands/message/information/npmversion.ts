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
  aliases: ["npmv", "npm-info", "npmpkg"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    if (!args[0]) {
      return message.reply({
        embeds: [
          {
            title: "Error - NPM Package",
            description: [
              `${client.getEmoji(message.guild.id, "error")} Please provide a package name.`,
              `Usage: \`${prefix}${this.name} <package-name>\``,
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
              title: "Error - NPM Package",
              description: [
                `${client.getEmoji(message.guild.id, "error")} Package not found.`,
                `Please check the package name and try again.`,
              ].join("\n"),
            },
          ],
        });
      }
      console.error("Error fetching NPM package:", error);
      return message.reply({
        embeds: [
          {
            title: "Error - NPM Package",
            description: [
              `${client.getEmoji(message.guild.id, "error")} An error occurred while fetching the package data.`,
              `Please try again later or check the package name.`,
            ].join("\n"),
          },
        ],
      });
    }

    // Main embed with basic info
    const mainEmbed = new EmbedBuilder()
      .setTitle(`NPM Package: ${pkgData.name}`)
      .setColor(0xcb3837) // NPM red color
      .setDescription(pkgData.description || "No description provided")
      .addFields(
        { name: "Latest Version", value: pkgData["dist-tags"]?.latest || "Unknown", inline: true },
        {
          name: "License",
          value: typeof pkgData.license === "string" ? pkgData.license : "Unknown",
          inline: true,
        },
        {
          name: "Author",
          value:
            typeof pkgData.author === "object" ? pkgData.author.name : pkgData.author || "Unknown",
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
        name: "Repository",
        value: `[View on GitHub](${repoUrl})`,
        inline: true,
      });
    }

    // Add homepage if available
    if (pkgData.homepage) {
      mainEmbed.addFields({
        name: "Homepage",
        value: `[Visit Website](${pkgData.homepage})`,
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
        name: "Issue Tracker",
        value: `[Report Issues](${bugsUrl})`,
        inline: true,
      });
    }

    // Create buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("View on NPM")
        .setURL(`https://www.npmjs.com/package/${pkgData.name}`)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel("View Dependencies")
        .setCustomId("view_deps")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel("View Versions")
        .setCustomId("view_versions")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel("View README")
        .setCustomId("view_readme")
        .setStyle(ButtonStyle.Secondary),
    );

    // Create versions select menu
    const versions = Object.keys(pkgData.versions || {})
      .reverse()
      .slice(0, 25);
    const versionSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_version")
        .setPlaceholder("Select a version to view details")
        .addOptions(
          versions.map((version) => ({
            label: version,
            value: version,
            description: `Released on ${pkgData.time?.[version] || "unknown date"}`,
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
            .setTitle(`Dependencies for ${pkgData.name}`)
            .setColor(0xcb3837);

          if (Object.keys(dependencies).length > 0) {
            depsEmbed.addFields({
              name: "Production Dependencies",
              value: Object.entries(dependencies)
                .map(([name, version]) => `• ${name}: ${version}`)
                .join("\n"),
            });
          }

          if (Object.keys(devDependencies).length > 0) {
            depsEmbed.addFields({
              name: "Development Dependencies",
              value: Object.entries(devDependencies)
                .map(([name, version]) => `• ${name}: ${version}`)
                .join("\n"),
            });
          }

          if (Object.keys(dependencies).length === 0 && Object.keys(devDependencies).length === 0) {
            depsEmbed.setDescription("This package has no dependencies.");
          }

          await interaction.editReply({ embeds: [mainEmbed, depsEmbed] });
          break;
        }

        case "view_versions": {
          const versionsEmbed = new EmbedBuilder()
            .setTitle(`Available Versions for ${pkgData.name}`)
            .setColor(0xcb3837)
            .setDescription(
              Object.entries(pkgData.time || {})
                .filter(([key]) => !key.startsWith("created") && !key.startsWith("modified"))
                .map(([version, date]) => `• ${version} - ${new Date(date).toLocaleDateString()}`)
                .join("\n")
                .slice(0, 2000), // Discord embed limit
            );

          await interaction.editReply({ embeds: [mainEmbed, versionsEmbed] });
          break;
        }

        case "view_readme": {
          const readmeText = pkgData.readme || "No README available";
          const readmeEmbed = new EmbedBuilder()
            .setTitle(`README for ${pkgData.name}`)
            .setColor(0xcb3837)
            .setDescription(
              readmeText.length > 2000 ? `${readmeText.substring(0, 2000)}...` : readmeText,
            );

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
        .setTitle(`Version ${selectedVersion} of ${pkgData.name}`)
        .setColor(0xcb3837)
        .addFields(
          { name: "Published", value: pkgData.time?.[selectedVersion] || "Unknown", inline: true },
          {
            name: "Dependencies",
            value: Object.keys(versionData.dependencies || {}).length.toString(),
            inline: true,
          },
          {
            name: "Dev Dependencies",
            value: Object.keys(versionData.devDependencies || {}).length.toString(),
            inline: true,
          },
        );

      if (versionData.deprecated) {
        versionEmbed.addFields({
          name: "⚠️ Deprecation Warning",
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
