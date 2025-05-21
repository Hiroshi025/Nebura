import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  ChannelType,
  EmbedBuilder,
  TextChannel,
} from "discord.js";

import { client, main } from "@/main";
import { Addons } from "@/modules/discord/structure/addons";
import { PM2Manager } from "@/shared/class/PM2";
// Importa WinstonLogger
import { WinstonLogger } from "@/shared/class/winston";
import { logWithLabel } from "@utils/functions/console";

import configuration from "./config";

const pm2Manager = PM2Manager.getInstance(); // Usar el Singleton de PM2Manager
// Instancia global del logger
const logger = new WinstonLogger();

export default new Addons(
  {
    name: "PM2 Manager",
    description: "Interactive PM2 process manager for Discord.",
    author: "Hiroshi025",
    version: "1.1.0",
    bitfield: ["Administrator"],
  },
  async () => {
    async function updatePM2Status() {
      try {
        const processes = await pm2Manager.listProcesses();

        const embed = new EmbedBuilder()
          .setTitle("PM2 Process Monitor")
          .setColor(0x00ff00)
          .setDescription(
            [
              `> **Total Processes:** ${processes.length}`,
              `> **Uptime:** ${Math.floor(process.uptime() / 60)} minutes`,
              `> **Memory Usage:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
              `> **CPU Usage:** ${process.cpuUsage().user / 1000} ms`,
            ].join("\n"),
          )
          .setTimestamp();

        processes.forEach((proc) => {
          embed.addFields({
            name: `**${proc.name}** (ID: ${proc.pm_id})`,
            value: [
              `> **Status:** ${proc.status}`,
              `> **CPU:** ${proc.cpu}%`,
              `> **Memory:** ${(proc.memory / 1024 / 1024).toFixed(2)} MB`,
              `> **Uptime:** ${Math.floor(proc.uptime / 1000)}s`,
              `> **Restarts:** ${proc.restart_time}`,
            ].join("\n"),
            inline: true,
          });
        });

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("reset_all")
            .setLabel("Restart All")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("get_info")
            .setLabel("Get Process Info")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("stop_process")
            .setLabel("Stop Process")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("start_process")
            .setLabel("Start Process")
            .setStyle(ButtonStyle.Success),
        );

        const buttonsv2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("delete_process")
            .setLabel("Delete Process")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("get_all_processes")
            .setLabel("Get All Processes")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("get_addon_info")
            .setLabel("Get Addon Info")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("kill_all_processes")
            .setLabel("Kill All Processes")
            .setStyle(ButtonStyle.Danger),
        );

        // Agrega los nuevos botones al panel
        const systemButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("system_info")
            .setLabel("System Info")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("💻"),
          new ButtonBuilder()
            .setCustomId("bot_restart")
            .setLabel("Restart Bot")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔄"),
          new ButtonBuilder()
            .setCustomId("bot_shutdown")
            .setLabel("Shutdown Bot")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏹️"),
          new ButtonBuilder()
            .setCustomId("show_logs")
            .setLabel("Show Logs")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📄"),
          new ButtonBuilder()
            .setCustomId("panel_help")
            .setLabel("Panel Help")
            .setStyle(ButtonStyle.Success)
            .setEmoji("❓"),
        );

        const channel: TextChannel = (await main.discord.channels.fetch(
          configuration.channelid,
        )) as TextChannel;
        if (!channel?.isTextBased()) throw new Error("Invalid channel.");

        let message = await channel.messages.fetch(configuration.messageid).catch(() => null);

        if (!message || message.author !== client.user) {
          logWithLabel("custom", "Message not found, sending a new one.", {
            customLabel: "PM2",
          });
          message = await channel.send({
            content: "Status updated by PM2 Manager.",
            embeds: [embed],
            components: [buttons, buttonsv2],
          });
          configuration.messageid = message.id;
        } else {
          await message.edit({
            content: "Status updated by PM2 Manager.",
            embeds: [embed],
            components: [buttons, buttonsv2, systemButtons],
          });
        }
      } catch (error: any) {
        logWithLabel("error", `Error updating PM2 status: ${error.message}`, {
          customLabel: "PM2",
          context: { channelId: configuration.channelid },
        });
      }
    }

    async function handleButtonInteraction(interaction: ButtonInteraction<CacheType>) {
      if (
        !interaction.channel ||
        !interaction.guild ||
        interaction.channel.type !== ChannelType.GuildText
      )
        return;
      const customId = interaction.customId;

      if (customId === "reset_all") {
        await pm2Manager.restartProcess("all");
        await interaction.reply("All processes have been restarted.");
      } else if (customId === "get_info") {
        await interaction.reply("Please provide the process ID.");
        const idCollector = interaction.channel.createMessageCollector({
          filter: (msg) => msg.author.id === interaction.user.id,
          max: 1,
          time: 30000,
        });

        idCollector.on("collect", async (msg) => {
          const processId = msg.content;
          const processInfo = await pm2Manager.getProcessInfo(processId);
          if (processInfo) {
            const infoEmbed = new EmbedBuilder()
              .setTitle(`Process Info: ${processInfo.name}`)
              .setColor(0x00ff00)
              .addFields(
                { name: "Status", value: processInfo.status, inline: true },
                { name: "CPU", value: `${processInfo.cpu}%`, inline: true },
                {
                  name: "Memory",
                  value: `${(processInfo.memory / 1024 / 1024).toFixed(2)} MB`,
                  inline: true,
                },
                {
                  name: "Uptime",
                  value: `${Math.floor(processInfo.uptime / 1000)}s`,
                  inline: true,
                },
                { name: "Restarts", value: `${processInfo.restart_time}`, inline: true },
              )
              .setTimestamp();
            await msg.reply({ embeds: [infoEmbed] });
          } else {
            await msg.reply("Process not found.");
          }
        });
      } else if (customId === "stop_process") {
        await interaction.reply("Please provide the process ID to stop.");
        const idCollector = interaction.channel.createMessageCollector({
          filter: (msg) => msg.author.id === interaction.user.id,
          max: 1,
          time: 30000,
        });

        idCollector.on("collect", async (msg) => {
          const processId = msg.content;
          const result = await pm2Manager.stopProcess(processId);
          await msg.reply(result.message);
        });
      } else if (customId === "start_process") {
        await interaction.reply("Please provide the process ID to start.");
        const idCollector = interaction.channel.createMessageCollector({
          filter: (msg) => msg.author.id === interaction.user.id,
          max: 1,
          time: 30000,
        });

        idCollector.on("collect", async (msg) => {
          const processId = msg.content;
          const result = await pm2Manager.startProcess("", processId); // Adjust scriptPath if needed
          await msg.reply(result.message);
        });
      } else if (customId === "delete_process") {
        await interaction.reply("Please provide the process ID to delete.");
        const idCollector = interaction.channel.createMessageCollector({
          filter: (msg) => msg.author.id === interaction.user.id,
          max: 1,
          time: 30000,
        });

        idCollector.on("collect", async (msg) => {
          const processId = msg.content;
          const result = await pm2Manager.deleteProcess(processId);
          await msg.reply(result.message);
        });
      } else if (customId === "get_all_processes") {
        const processes = await pm2Manager.listProcesses();
        const processList = processes
          .map(
            (proc) =>
              `**${proc.name}** (ID: ${proc.pm_id}) - Status: ${proc.status}, CPU: ${proc.cpu}%, Memory: ${(proc.memory / 1024 / 1024).toFixed(2)} MB`,
          )
          .join("\n");

        await interaction.reply({
          content: processList || "No processes found.",
          ephemeral: true,
        });
      } else if (customId === "get_addon_info") {
        const uptime = process.uptime(); // Node.js process uptime in seconds
        const addonInfo = [
          `**Addon Name:** PM2 Manager`,
          `**Version:** 1.1.0`,
          `**Author:** Hiroshi025`,
          `**Uptime:** ${Math.floor(uptime / 60)} minutes`,
        ].join("\n");

        await interaction.reply({
          content: addonInfo,
          ephemeral: true,
        });
      } else if (customId === "kill_all_processes") {
        const processes = await pm2Manager.listProcesses();
        if (processes.length > 0) {
          await pm2Manager.stopProcess("all");
          await interaction.reply("All processes have been killed.");
        } else {
          await interaction.reply("No processes found to kill.");
        }
      }
      // Nuevos handlers para los botones del sistema
      else if (customId === "system_info") {
        const os = require("os");
        const uptime = process.uptime();
        const totalMem = os.totalmem() / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const cpuModel = os.cpus()[0].model;
        const platform = os.platform();
        const nodeVersion = process.version;

        const sysEmbed = new EmbedBuilder()
          .setTitle("💻 System Information")
          .setColor(0x3498db)
          .addFields(
            { name: "🖥️ OS", value: platform, inline: true },
            { name: "⚙️ CPU", value: cpuModel, inline: false },
            { name: "💾 Total Memory", value: `${totalMem.toFixed(2)} MB`, inline: true },
            { name: "📊 Used Memory", value: `${usedMem.toFixed(2)} MB`, inline: true },
            { name: "🟢 Free Memory", value: `${freeMem.toFixed(2)} MB`, inline: true },
            { name: "🟦 Node.js", value: nodeVersion, inline: true },
            { name: "⏱️ Uptime", value: `${Math.floor(uptime / 60)} min`, inline: true },
          )
          .setTimestamp();

        await interaction.reply({ embeds: [sysEmbed], ephemeral: true });
      } else if (customId === "bot_restart") {
        const restartEmbed = new EmbedBuilder()
          .setTitle("🔄 Bot Restart")
          .setDescription("The bot will restart in a few seconds...")
          .setColor(0xe67e22)
          .setTimestamp();
        await interaction.reply({ embeds: [restartEmbed], ephemeral: true });
        setTimeout(() => process.exit(0), 1500);
      } else if (customId === "bot_shutdown") {
        const shutdownEmbed = new EmbedBuilder()
          .setTitle("⏹️ Bot Shutdown")
          .setDescription("The bot will shut down in a few seconds...")
          .setColor(0xc0392b)
          .setTimestamp();
        await interaction.reply({ embeds: [shutdownEmbed], ephemeral: true });
        setTimeout(() => process.exit(0), 1500);
      } else if (customId === "show_logs") {
        // Obtiene los logs recientes usando WinstonLogger
        const recentLogs = logger.getRecentLogs(3); // últimos 3 días
        if (recentLogs.length === 0) {
          const noLogsEmbed = new EmbedBuilder()
            .setTitle("📄 Logs")
            .setDescription("No log files found.")
            .setColor(0xe74c3c);
          await interaction.reply({ embeds: [noLogsEmbed], ephemeral: true });
          return;
        }

        // Lee el contenido del log más reciente
        const latestLog = recentLogs[0];
        const logEntries = await logger.getLogContent(latestLog.filename);
        const lastLines = logEntries
          .slice(-10)
          .map((entry) => {
            const { timestamp, level, message } = entry;
            return `\`${timestamp}\` [${level}] ${message}`;
          })
          .join("\n");

        const logsEmbed = new EmbedBuilder()
          .setTitle("📄 Latest Log Entries")
          .setDescription(lastLines || "No log entries found.")
          .addFields(
            { name: "🗂️ File", value: latestLog.filename, inline: true },
            { name: "📅 Last Modified", value: latestLog.lastModified, inline: true },
            { name: "📦 Size", value: latestLog.size, inline: true },
          )
          .setColor(0x95a5a6)
          .setTimestamp();

        await interaction.reply({ embeds: [logsEmbed], ephemeral: true });
      } else if (customId === "panel_help") {
        const helpEmbed = new EmbedBuilder()
          .setTitle("❓ Panel Help")
          .setColor(0x2ecc71)
          .setDescription(
            "This panel allows you to manage and monitor the bot and PM2 processes directly from Discord.",
          )
          .addFields(
            {
              name: "🟢 PM2 Management",
              value:
                "- View processes\n- Restart, stop, start, delete processes\n- Get process info\n- Kill all processes",
              inline: false,
            },
            {
              name: "💻 System Info",
              value: "- View CPU, memory usage, uptime, Node.js version, OS",
              inline: false,
            },
            {
              name: "🔄 Bot Control",
              value: "- Restart or shutdown the bot from Discord",
              inline: false,
            },
            { name: "📄 Logs & Monitoring", value: "- View the latest bot logs", inline: false },
            {
              name: "ℹ️ Addon Info",
              value: "- View version, author, and uptime of the panel",
              inline: false,
            },
            { name: "❓ Help", value: "- Show this help panel", inline: false },
          )
          .setFooter({ text: "Developed by Hiroshi025" })
          .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
      }
    }

    if (configuration.enabled) {
      updatePM2Status();
      setInterval(updatePM2Status, 5 * 60 * 1000); // Update every 5 minutes

      main.discord.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        await handleButtonInteraction(interaction);
      });
    }
  },
);
