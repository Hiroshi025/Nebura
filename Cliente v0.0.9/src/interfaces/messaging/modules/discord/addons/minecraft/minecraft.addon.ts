import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder, TextChannel
} from "discord.js";

import { main } from "@/main";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";

import _package from "../../../../../../../package.json";
import { Addons } from "../../structure/addons";
import configuration from "./config";
import { MinecraftServerConfig } from "./types";

export default new Addons(
  {
    name: "Advanced Minecraft Status Handler",
    description: "Advanced status monitoring for multiple Minecraft servers",
    author: _package.author,
    version: _package.version,
    bitfield: ["ManageChannels", "SendMessages", "EmbedLinks"],
  },
  async (client) => {
    // Cache for server statuses
    const statusCache: Record<string, any> = {};
    let lastApiResponseTime: number = 0;
    let errorCount: number = 0;
    let lastError: string | null = null;

    /**
     * Fetches server status from API with proper error handling
     */
    async function fetchServerStatus(server: MinecraftServerConfig): Promise<any> {
      try {
        const apiUrl =
          server.type === "bedrock"
            ? `https://api.mcsrvstat.us/bedrock/3/${server.ip}${server.port ? `:${server.port}` : ""}`
            : `https://api.mcsrvstat.us/3/${server.ip}${server.port ? `:${server.port}` : ""}`;

        const apiStartTime = Date.now();
        const response = await axios.get(apiUrl, {
          timeout: configuration.timeout,
          headers: {
            "User-Agent": `DiscordBot/${_package.version} (${_package.author})`,
          },
        });

        lastApiResponseTime = Date.now() - apiStartTime;
        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new Error(`API Error: ${error.response.status} ${error.response.statusText}`);
          } else if (error.request) {
            throw new Error("API request timed out or failed to connect");
          } else {
            throw new Error(`API configuration error: ${error.message}`);
          }
        } else {
          throw new Error(`Unexpected error: ${error.message}`);
        }
      }
    }

    /**
     * Creates a rich embed with server status information
     */
    function createStatusEmbed(serverConfig: MinecraftServerConfig, statusData: any, lang: string): EmbedBuilder {
      const isOnline = statusData?.online === true;
      const embedColor = isOnline ? 0x00ff00 : 0xff0000;
      const statusText = isOnline
        ? client.t("discord:minecraft.online", {}, lang)
        : client.t("discord:minecraft.offline", {}, lang);
      const statusEmoji = isOnline
        ? client.getEmoji(config.modules.discord.guildId, "online") || "🟢"
        : client.getEmoji(config.modules.discord.guildId, "offline") || "🔴";

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`${statusEmoji} ${serverConfig.displayName || serverConfig.name} - ${statusText}`)
        .setDescription(serverConfig.description || client.t("discord:minecraft.noDescription", {}, lang))
        .setFooter({
          text: `${client.t("discord:minecraft.lastUpdate", {}, lang)}: ${new Date().toLocaleString()} | ${client.t("discord:minecraft.apiResponse", { ms: lastApiResponseTime }, lang)}`,
          iconURL: client.user?.displayAvatarURL(),
        })
        .setTimestamp();

      embed.addFields({
        name: `🔗 ${client.t("discord:minecraft.connectionInfo", {}, lang)}`,
        value: [
          `**${client.t("discord:minecraft.address", {}, lang)}:** \`${statusData.ip || serverConfig.ip}\``,
          `**${client.t("discord:minecraft.port", {}, lang)}:** \`${statusData.port || serverConfig.port || client.t("discord:minecraft.default", {}, lang)}\``,
          `**${client.t("discord:minecraft.type", {}, lang)}:** ${serverConfig.type.toUpperCase()}`,
        ].join("\n"),
        inline: true,
      });

      if (isOnline) {
        embed.addFields({
          name: `📋 ${client.t("discord:minecraft.versionInfo", {}, lang)}`,
          value: [
            `**${client.t("discord:minecraft.version", {}, lang)}:** ${statusData.version || client.t("discord:minecraft.unknown", {}, lang)}`,
            `**${client.t("discord:minecraft.protocol", {}, lang)}:** ${statusData.protocol?.name || statusData.protocol?.version || client.t("discord:minecraft.unknown", {}, lang)}`,
            `**${client.t("discord:minecraft.software", {}, lang)}:** ${statusData.software || client.t("discord:minecraft.vanilla", {}, lang)}`,
          ].join("\n"),
          inline: true,
        });

        const players = statusData.players || {};
        const playerCount = `${players.online || 0}/${players.max || 0}`;
        const playerList =
          players.list
            ?.slice(0, 10)
            .map((p: any) => `• ${p.name}`)
            .join("\n") || client.t("discord:minecraft.noPlayersOnline", {}, lang);

        embed.addFields({
          name: `👥 ${client.t("discord:minecraft.players", { count: playerCount }, lang)}`,
          value: playerList.length > 1000 ? playerList.substring(0, 1000) + "..." : playerList,
          inline: false,
        });

        if (statusData.motd?.clean) {
          embed.addFields({
            name: `📜 ${client.t("discord:minecraft.motd", {}, lang)}`,
            value: statusData.motd.clean.join("\n").slice(0, 1024),
            inline: false,
          });
        }

        if (statusData.icon) {
          embed.setThumbnail(
            `https://api.mcsrvstat.us/icon/${serverConfig.ip}${serverConfig.port ? `:${serverConfig.port}` : ""}`,
          );
        }
      } else {
        embed.addFields({
          name: `🔍 ${client.t("discord:minecraft.debugInfo", {}, lang)}`,
          value: [
            `**${client.t("discord:minecraft.lastError", {}, lang)}:** ${lastError || client.t("discord:minecraft.none", {}, lang)}`,
            `**${client.t("discord:minecraft.errorCount", {}, lang)}:** ${errorCount}`,
            `**${client.t("discord:minecraft.cacheStatus", {}, lang)}:** ${statusData.debug?.cachehit ? "HIT" : "MISS"}`,
          ].join("\n"),
          inline: false,
        });
      }

      return embed;
    }

    /**
     * Creates interactive components for the message
     */
    function createMessageComponents(servers: MinecraftServerConfig[], currentServer: string, lang: string) {
      // Server selection dropdown
      const serverSelect = new StringSelectMenuBuilder()
        .setCustomId("minecraft_server_select")
        .setPlaceholder(client.t("discord:minecraft.selectServer", {}, lang))
        .addOptions(
          servers.map((server) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(server.displayName || server.name)
              .setDescription(server.description?.slice(0, 50) || "")
              .setValue(server.name)
              .setDefault(server.name === currentServer),
          ),
        );

      // Action buttons
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("refresh_status")
          .setLabel(client.t("discord:minecraft.refresh", {}, lang))
          .setEmoji("🔄")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(client.t("discord:minecraft.apiDocs", {}, lang))
          .setEmoji("📄")
          .setURL("https://api.mcsrvstat.us/"),
      );

      return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(serverSelect), buttons];
    }

    /**
     * Updates the status message in Discord
     */
    async function updateStatusMessage(serverName: string, lang: string) {
      try {
        const serverConfig = configuration.servers.find((s) => s.name === serverName);
        if (!serverConfig) throw new Error(`Server config not found: ${serverName}`);

        const channel = (await main.discord.channels.fetch(configuration.channelId)) as TextChannel;
        if (!channel?.isTextBased()) throw new Error("Invalid channel");

        // Get server status
        let statusData;
        try {
          statusData = await fetchServerStatus(serverConfig);
          statusCache[serverName] = statusData;
          errorCount = 0;
          lastError = null;
        } catch (error: any) {
          errorCount++;
          lastError = error.message;
          logWithLabel("error", `Error fetching status for ${serverName}: ${error.message}`, {
            customLabel: "Minecraft",
            context: { server: serverName, errorCount },
          });

          // Use cached data if available
          statusData = statusCache[serverName] || { online: false };
        }

        // Create embed and components
        const embed = createStatusEmbed(serverConfig, statusData, lang);
        const components = createMessageComponents(configuration.servers, serverName, lang);

        // Calculate uptime percentage (simplified)
        const uptimePercentage = statusData.online ? "100%" : "0%";

        // Message content
        const content = [
          `## ${serverConfig.displayName || serverConfig.name} ${client.t("discord:minecraft.status", {}, lang)}`,
          `**${client.t("discord:minecraft.uptime", {}, lang)}:** ${uptimePercentage} | **${client.t("discord:minecraft.errors", {}, lang)}:** ${errorCount}`,
          `**${client.t("discord:minecraft.lastUpdate", {}, lang)}:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        ].join("\n");

        // Try to edit existing message or send new one
        let message;
        if (configuration.messageId) {
          try {
            message = await channel.messages.fetch(configuration.messageId);
            if (message.author.id !== client.user?.id) {
              throw new Error("Message not owned by bot");
            }
            await message.edit({ content, embeds: [embed], components });
          } catch {
            // If message doesn't exist or can't be edited, send new one
            message = await channel.send({ content, embeds: [embed], components });
            configuration.messageId = message.id;
          }
        } else {
          message = await channel.send({ content, embeds: [embed], components });
          configuration.messageId = message.id;
        }

        return message;
      } catch (error: any) {
        logWithLabel("error", `Failed to update status message: ${error.message}`, {
          customLabel: "Minecraft",
          context: { server: serverName, error: error.stack },
        });
        throw error;
      }
    }

    /**
     * Main function to initialize the status monitoring
     */
    async function initializeStatusHandler() {
      if (!configuration.enabled) return;

      // Initial status update
      try {
        await updateStatusMessage(
          configuration.defaultServer || configuration.servers[0].name,
          client.guilds.cache.first()?.preferredLocale || "en-US",
        );
        logWithLabel("info", "Initial Minecraft server status update completed");
      } catch (error: any) {
        logWithLabel("error", `Initial status update failed: ${error.message}`);
      }

      // Set up periodic updates
      setInterval(async () => {
        try {
          await updateStatusMessage(
            configuration.defaultServer || configuration.servers[0].name,
            client.guilds.cache.first()?.preferredLocale || "en-US",
          );
        } catch (error) {
          console.error("Periodic status update failed:", error);
        }
      }, configuration.updateInterval);

      // Set up interaction handling
      client.on("interactionCreate", async (interaction) => {
        if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
        if (!["minecraft_server_select", "refresh_status"].includes(interaction.customId)) return;

        await interaction.deferUpdate();

        try {
          if (interaction.isStringSelectMenu()) {
            // Server selection changed
            const selectedServer = interaction.values[0];
            await updateStatusMessage(selectedServer, client.guilds.cache.first()?.preferredLocale || "en-US");
          } else if (interaction.isButton() && interaction.customId === "refresh_status") {
            // Refresh button clicked
            const currentServer = configuration.defaultServer || configuration.servers[0].name;
            await updateStatusMessage(currentServer, client.guilds.cache.first()?.preferredLocale || "en-US");
          }
        } catch (error) {
          logWithLabel("error", `Interaction handling failed: ${error}`);
          await interaction.followUp({
            content: "❌ Failed to update status. Please try again later.",
            flags: "Ephemeral",
          });
        }
      });
    }

    // Start the status handler
    initializeStatusHandler().catch((error) => {
      logWithLabel("error", `Failed to initialize Minecraft status handler: ${error.message}`);
    });
  },
);