import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel
} from "discord.js";

// import puppeteer from "puppeteer"; // Comentado temporalmente
import { client, main } from "@/main";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

import _package from "../../../../package.json";
import { Addons } from "../infrastructure/addons";

/**
 * ############################################################################
 * #
 * # Advertencia: Addon Warning.
 * # La configuracion de addon de estado es obligatoria el apartado messageid
 * # aun que si es posible no agregarlo se recomienda agregar la id ya que en caso de reiniciar el bot
 * # el bot no podra editar el mensaje de estado y tendra que volver a enviar uno nuevo.
 * #
 * ############################################################################
 */

export default new Addons(
  {
    name: "Status Handler",
    description: "Status handler for the project",
    author: _package.author,
    version: _package.version,
    bitfield: ["ManageChannels"],
  },
  async () => {
    // Configuration object for the status handler
    const configuration = {
      enabled: false,
      timeout: 60000,
      website: "",
      messageid: "",
      channelid: "",
      minecraftserver: {
        type: "java",
        ip: "",
        port: 25565,
        api: "https://api.mcsrvstat.us/3/",
      },
    };

    // Main function to handle status updates
    async function Main() {
      let status: boolean = false; // Tracks the server status (online/offline)
      const startTime = Date.now(); // Tracks the start time for elapsed time calculations

      /**
       * Function to update the server status and send/edit the Discord message.
       */
      const updateStatus = async () => {
        try {
          const apiStartTime = Date.now(); // Start time for API response time calculation
          const res = await axios({
            method: "GET",
            baseURL: configuration.minecraftserver.api,
            url: configuration.minecraftserver.ip,
            headers: {
              "User-Agent": `DiscordBot ${_package.version} (${_package.author})`,
            },
          });
          const apiResponseTime = Date.now() - apiStartTime; // Calculate API response time

          // Validate response data
          if (!res.data) {
            logWithLabel("error", "API response is empty or invalid.", "Status Handler");
            return;
          }

          // Generate image from HTML (motd.html) - Comentado temporalmente
          /*
          let attachment: AttachmentBuilder | null = null;
          if (res.data.motd?.html) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(res.data.motd.html, { waitUntil: "networkidle0" });
            const screenshotBuffer = await page.screenshot({ encoding: "base64" });
            await browser.close();

            // Create an attachment from the buffer
            attachment = new AttachmentBuilder(Buffer.from(screenshotBuffer, "base64"), {
              name: "motd_image.png",
            });
          }
          */

          // Determine server status based on API response
          if (res.status === 200 && res.data.online !== undefined) {
            status = res.data.online;
          } else {
            logWithLabel(
              "error",
              `Unexpected API response: ${JSON.stringify(res.data, null, 2)}`,
              "Status Handler",
            );
            status = false;
          }

          if (!status) {
            logWithLabel("custom", "Server is offline.", "Status Handler");
            return;
          }

          // Create an embed with server information
          const embed = new EmbedBuilder()
            .setTitle(` ${emojis.online} Status Handler [Minecraft Configuration]`)
            .setFooter({
              text: `Response: ${apiResponseTime}ms | Node.js: ${process.versions.node}`,
              iconURL: client.user?.displayAvatarURL() || "",
            })
            .setTimestamp()
            .setAuthor({
              name: `Status Handler - ${configuration.minecraftserver.ip}`,
              iconURL: client.user?.displayAvatarURL() || "",
            })
            .setColor(0x00ff00) // Green color for online status
            .setDescription(
              [
                `> **Server IP:** ${res.data.ip || "Unknown"} (\`${res.data.port}\`)`,
                `> **Hostname:** ${res.data.hostname || "No hostname detected"}\n`,
              ].join("\n"),
            );

          // Add the image to the embed if available - Comentado temporalmente
          /*
          if (attachment) {
            embed.setImage(`attachment://${attachment.name}`);
          }
          */

          // Add additional fields based on server online status
          if (res.data.online) {
            embed.setFields(
              {
                name: "__Server Information__",
                value: [
                  `> **Server Version:** ${res.data.version || "Unknown"}`,
                  `> **Server Software:** ${res.data.software || "No software"}`,
                  `> **Server Gamemode:** ${res.data.gamemode || "No gamemode"}`,
                ].join("\n"),
                inline: true,
              },
              {
                name: "__Server Players__",
                value: [
                  `> **Players Online:** ${res.data.players?.online || 0} (\`${res.data.players?.list?.length || 0}\`)`,
                  `> **Max Players:** ${res.data.players?.max || 0} (\`${res.data.players?.max || 0}\`)`,
                  `> **Players List:** ${res.data.players?.list || "No players"}`,
                ].join("\n"),
                inline: true,
              },
            );
          } else {
            embed
              .setFields({
                name: `${emojis.offline} Server Status [Offline]`,
                value: [
                  `> **Datetime:** ${new Date().toLocaleString()}`,
                  `> **Server IP:** ${res.data.ip || "Unknown"}`,
                ].join("\n"),
                inline: true,
              })
              .setColor(0xff0000); // Red color for offline status
          }

          const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("API")
              .setEmoji(emojis.minecraft.server_ip)
              .setURL(configuration.minecraftserver.api + configuration.minecraftserver.ip),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("Website")
              .setEmoji(emojis.minecraft.server_seed)
              .setURL(configuration.website),
          );

          // Fetch the Discord channel
          const channel: TextChannel = (await main.discord.channels.fetch(
            configuration.channelid,
          )) as TextChannel;
          if (!channel?.isTextBased()) throw new Error("Invalid channel");

          // Fetch the existing message or send a new one
          let message = await channel.messages.fetch(configuration.messageid).catch(() => null);
          if (!client.user) throw new Error("User not found");

          if (!message || message == null) {
            logWithLabel("custom", "Message not found, sending a new one.", "Status");
            // Send a new message if the existing one is not found or invalid
            message = await channel.send({
              content: [
                `Status updated by: ${client.user?.tag}`,
                `Time since last update: N/A`,
                `API Response Time: ${apiResponseTime}ms`,
                `Errors: None`,
              ].join("\n"),
              embeds: [embed],
              components: [buttons],
              // files: attachment ? [attachment] : [], // Comentado temporalmente
            });
            configuration.messageid = message.id; // Save the new message ID
          }

          if (message.author !== client.user) {
            logWithLabel("custom", "Message author mismatch, sending a new one.", "Status");
            // Send a new message if the existing one is not found or invalid
            message = await channel.send({
              content: [
                `Status updated by: ${client.user?.tag}`,
                `Time since last update: N/A`,
                `API Response Time: ${apiResponseTime}ms`,
                `Errors: None`,
              ].join("\n"),
              embeds: [embed],
              components: [buttons],
              // files: attachment ? [attachment] : [], // Comentado temporalmente
            });
            configuration.messageid = message.id; // Save the new message ID
          } else {
            // Edit the existing message
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            await message.edit({
              content: [
                `Status updated by: ${client.user?.tag}`,
                `Time since last update: ${elapsedTime} seconds`,
                `API Response Time: ${apiResponseTime}ms`,
                `Errors: None`,
              ].join("\n"),
              embeds: [embed],
              components: [buttons],
              // files: attachment ? [attachment] : [], // Comentado temporalmente
            });
          }
        } catch (error: any) {
          logWithLabel("error", `Error updating the status: ${error.message}`, "Status Handler");
          console.error(error);
        }
      };

      // Schedule the first update after 1 minute
      setTimeout(() => {
        updateStatus();
        // Schedule subsequent updates every 5 minutes
        setInterval(updateStatus, 5 * 60 * 1000);
      }, 60 * 1000);
    }

    // Check if the status handler is enabled and call the main function
    if (configuration.enabled) {
      Main().catch((error) => {
        logWithLabel("error", `Error initializing status handler: ${error}`);
      });
    } else {
      logWithLabel("custom", "Status handler is disabled.", "Status");
    }
  },
);
