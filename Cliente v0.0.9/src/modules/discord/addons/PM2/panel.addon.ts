import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChannelType,
	EmbedBuilder, TextChannel
} from "discord.js";
import os from "os";
import process from "process";
import si from "systeminformation";

import { client, main } from "@/main";
import { Addons } from "@/modules/discord/structure/addons";
import { PM2Manager } from "@/shared/class/PM2";
// Importa WinstonLogger
import { WinstonLogger } from "@/shared/class/winston";
import { createCanvas } from "@napi-rs/canvas";
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
        console.log("[PM2 Panel] Iniciando actualización de estado PM2...");
        const processes = await pm2Manager.listProcesses();
        console.log(`[PM2 Panel] Procesos obtenidos: ${processes.length}`);

        const totalMem = os.totalmem() / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuCores = cpus.length;
        const platform = os.platform();
        const arch = os.arch();
        const hostname = os.hostname();
        const uptime = os.uptime();
        const nodeVersion = process.version;
        const botPing = main.discord?.ws.ping || 0;
        const loadAvg = os.loadavg();
        const userInfo = os.userInfo();
        const release = os.release();
        const network = os.networkInterfaces();

        // CPU usage calculation (more accurate)
        let cpuUsage = 0;
        if (cpus.length > 0) {
          const cpu = cpus[0];
          const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
          const idle = cpu.times.idle;
          cpuUsage = 100 - (idle / total) * 100;
        }

        // Memory usage breakdown
        // Elimina buffersMem y cachedMem de os, usa systeminformation si lo necesitas
        // const buffersMem = (os.totalmem() - os.freemem() - (os as any).buffers() || 0) / 1024 / 1024;
        // const cachedMem = ((os as any).cached() || 0) / 1024 / 1024;
        let buffersMem = 0;
        let cachedMem = 0;
        try {
          const memInfo = await si.mem();
          buffersMem = memInfo.buffers ? memInfo.buffers / 1024 / 1024 : 0;
          cachedMem = memInfo.cached ? memInfo.cached / 1024 / 1024 : 0;
        } catch (e) {
          buffersMem = 0;
          cachedMem = 0;
        }

        // --- systeminformation: datos para el embed ---
        // Red
        const netStatsArr = await si.networkStats();
        const netStats =
          netStatsArr && netStatsArr.length > 0 ? netStatsArr[0] : { rx_bytes: 0, tx_bytes: 0 };
        // Disco
        const fsArr = await si.fsSize();
        const mainDisk = fsArr && fsArr.length > 0 ? fsArr[0] : { used: 0, size: 0 };
        // Home y tmp

        // --- Canvas Configuration ---
        const width = 650;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Background with gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#1a2a6c");
        gradient.addColorStop(1, "#23272A");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Title with icon placeholder
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#00b894";
        ctx.fillText("📊 Nebura Advanced System Monitor", 20, 35);

        // System overview box
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.roundRect(20, 50, 610, 80, 10);
        ctx.fill();

        // System info text
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`OS: ${platform} ${arch} | ${release}`, 30, 75);
        ctx.fillText(`CPU: ${cpuModel} (${cpuCores} cores)`, 30, 95);
        ctx.fillText(`Node.js: ${nodeVersion}`, 30, 115);
        ctx.fillText(`User: ${userInfo.username}@${hostname}`, 350, 75);
        ctx.fillText(`Uptime: ${formatUptime(uptime)}`, 350, 95);
        ctx.fillText(`Bot Ping: ${botPing}ms`, 350, 115);

        // Draw bar helper function
        function drawBar(
          label: string,
          used: number,
          total: number,
          y: number,
          color: string,
          unit = "MB",
          width = 300,
        ) {
          const percent = total > 0 ? Math.min(used / total, 1) : 0;
          ctx.font = '14px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = "#cccccc";
          ctx.fillText(label, 30, y + 20);

          // Background bar
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          ctx.roundRect(150, y - 10, width, 20, 5);
          ctx.fill();

          // Progress bar
          ctx.fillStyle = color;
          ctx.roundRect(150, y - 10, width * percent, 20, 5);
          ctx.fill();

          // Text info
          ctx.fillStyle = "#ffffff";
          ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
          if (total > 0) {
            const usedText = unit === "MB" ? `${used.toFixed(1)}MB` : `${used.toFixed(1)}%`;
            const totalText = unit === "MB" ? `${total.toFixed(1)}MB` : `${total}%`;
            ctx.fillText(
              `${usedText} / ${totalText} (${Math.round(percent * 100)}%)`,
              150 + width + 10,
              y + 5,
            );
          } else {
            ctx.fillText("N/A", 150 + width + 10, y + 5);
          }
        }

        // Resource usage section title
        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#00b894";
        ctx.fillText("Resource Usage", 30, 160);

        // Main resource bars
        drawBar("CPU", cpuUsage, 100, 180, "#0984e3", "%", 400);
        drawBar("RAM", usedMem, totalMem, 220, "#00b894", "MB", 400);
        drawBar("Disk", mainDisk.used || 0, mainDisk.size || 0, 260, "#fdcb6e", "MB", 400);

        // Detailed stats boxes
        // Memory details
        ctx.fillStyle = "rgba(0, 184, 148, 0.1)";
        ctx.roundRect(30, 290, 190, 90, 10);
        ctx.fill();

        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#00b894";
        ctx.fillText("Memory Details", 40, 310);

        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Used: ${usedMem.toFixed(1)}MB`, 40, 330);
        ctx.fillText(`Free: ${freeMem.toFixed(1)}MB`, 40, 345);
        ctx.fillText(`Buffers: ${buffersMem.toFixed(1)}MB`, 40, 360);
        ctx.fillText(`Cached: ${cachedMem.toFixed(1)}MB`, 40, 375);

        // CPU Load details
        ctx.fillStyle = "rgba(9, 132, 227, 0.1)";
        ctx.roundRect(230, 290, 190, 90, 10);
        ctx.fill();

        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#0984e3";
        ctx.fillText("CPU Load Averages", 240, 310);

        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`1 min: ${loadAvg[0].toFixed(2)}`, 240, 330);
        ctx.fillText(`5 min: ${loadAvg[1].toFixed(2)}`, 240, 345);
        ctx.fillText(`15 min: ${loadAvg[2].toFixed(2)}`, 240, 360);
        ctx.fillText(`Cores: ${cpuCores}`, 240, 375);

        // Network details
        ctx.fillStyle = "rgba(253, 203, 110, 0.1)";
        ctx.roundRect(430, 290, 190, 90, 10);
        ctx.fill();

        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#fdcb6e";
        ctx.fillText("Network Stats", 440, 310);

        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Received: ${formatBytes(netStats.rx_bytes)}`, 440, 330);
        ctx.fillText(`Sent: ${formatBytes(netStats.tx_bytes)}`, 440, 345);
        ctx.fillText(`Interfaces: ${Object.keys(network).length}`, 440, 360);
        ctx.fillText(`Host: ${hostname}`, 440, 375);

        // Footer
        ctx.font = '10px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillText(`Generated at ${new Date().toLocaleString()}`, 30, height - 10);

        // Helper functions
        function formatBytes(bytes: number): string {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }

        function formatUptime(seconds: number): string {
          const days = Math.floor(seconds / (3600 * 24));
          const hours = Math.floor((seconds % (3600 * 24)) / 3600);
          const mins = Math.floor((seconds % 3600) / 60);
          return `${days}d ${hours}h ${mins}m`;
        }

        // Convert canvas to buffer
        const buffer = await canvas.encode("png");
        console.log("[PM2 Panel] Imagen de sistema generada.");

        // Network info (first IPv4)
        let ip = "N/A";
        for (const iface of Object.values(network)) {
          if (!iface) continue;
          for (const net of iface) {
            if (net.family === "IPv4" && !net.internal) {
              ip = net.address;
              break;
            }
          }
          if (ip !== "N/A") break;
        }

        // Embed
        const embed = new EmbedBuilder()
          .setTitle("🟢 Nebura Client Panel")
          .setColor(0x1abc9c)
          .addFields(
            {
              name: " 📅 System Monitor",
              value: [
                `**Load Average:** \`\`\`${loadAvg.map((n) => n.toFixed(2)).join(" / ")}\`\`\``,
                `**CPU Usage:** \`\`\`${cpuUsage.toFixed(2)}%\`\`\``,
                `**Memory Usage:** \`\`\`${((usedMem / totalMem) * 100).toFixed(2)}%\`\`\``,
              ].join("\n"),
              inline: true,
            },
            {
              name: "🗃️ Sistema",
              value: [
                `**CPU:** \`\`\`${cpuModel}\`\`\` (${cpuCores} cores)`,
                `**RAM:** \`\`\`${usedMem.toFixed(2)} / ${totalMem.toFixed(2)} MB\`\`\``,
                `**Load Avg:** \`\`\`${loadAvg.map((n) => n.toFixed(2)).join(" / ")}\`\`\``,
                `**Disco:** \`\`\`${(mainDisk.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${(mainDisk.size / 1024 / 1024 / 1024).toFixed(2)}GB\`\`\``,
                `**Red:** RX \`\`\`${(netStats.rx_bytes / 1024 / 1024).toFixed(2)}MB | TX ${(netStats.tx_bytes / 1024 / 1024).toFixed(2)}MB\`\`\``,
              ].join("\n"),
              inline: false,
            },
            {
              name: "📊 Processes",
              value: processes.length
                ? processes
                    .map(
                      (proc) =>
                        `\`${proc.name}\` [ID: ${proc.pm_id}] | ${proc.status} | CPU: ${proc.cpu}% | RAM: ${(proc.memory / 1024 / 1024).toFixed(2)} MB | ⏱️ ${Math.floor(proc.uptime / 1000)}s | 🔄 ${proc.restart_time}`,
                    )
                    .join("\n")
                : "No active processes.",
            },
          )
          .setImage("attachment://system-stats.png")
          .setFooter({
            text: `Nebura Platform • PM2 Panel • Last update`,
          })
          .setTimestamp();

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

        let channel: TextChannel | null = null;
        try {
          channel = (await main.discord.channels.fetch(configuration.channelid)) as TextChannel;
        } catch (err) {
          logWithLabel("error", `No se pudo obtener el canal: ${configuration.channelid}`, {
            customLabel: "PM2",
          });
          console.error("[PM2 Panel] Error al obtener el canal:", err);
          return;
        }

        if (!channel?.isTextBased()) {
          logWithLabel("error", "El canal no es de texto o es inválido.", { customLabel: "PM2" });
          console.error("[PM2 Panel] Canal inválido:", channel);
          return;
        }

        let message = null;
        try {
          message = await channel.messages.fetch(configuration.messageid).catch(() => null);
        } catch (err) {
          logWithLabel("error", "Error al buscar el mensaje principal.", { customLabel: "PM2" });
          console.error("[PM2 Panel] Error al buscar el mensaje:", err);
        }

        if (!message || message.author?.id !== client.user?.id) {
          logWithLabel("custom", "Mensaje principal no encontrado, enviando uno nuevo.", {
            customLabel: "PM2",
          });
          try {
            message = await channel.send({
              content: [
                "Status updated by PM2 Manager.",
                "> Timezone: " +
                  new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
                "> Ultimate uptime: " + `<t:${Math.floor(Date.now() / 1000 - uptime)}:R>`,
              ].join("\n"),
              embeds: [embed],
              files: [{ attachment: buffer, name: "system-stats.png" }],
              components: [buttons, buttonsv2],
            });
            logWithLabel("custom", `Mensaje enviado con ID: ${message.id}`, { customLabel: "PM2" });
            configuration.messageid = message.id;
          } catch (err) {
            logWithLabel("error", "Error al enviar el mensaje principal.", { customLabel: "PM2" });
            console.error("[PM2 Panel] Error al enviar el mensaje:", err);
            return;
          }
        } else {
          try {
            await message.edit({
              content: [
                "Status updated by PM2 Manager.",
                "> Timezone: " +
                  new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
                "> Ultimate uptime: " + `<t:${Math.floor(Date.now() / 1000 - uptime)}:R>`,
              ].join("\n"),
              embeds: [embed],
              files: [{ attachment: buffer, name: "system-stats.png" }],
              components: [buttons, buttonsv2, systemButtons],
            });
            logWithLabel("custom", "Mensaje principal editado correctamente.", {
              customLabel: "PM2",
            });
          } catch (err) {
            logWithLabel("error", "Error al editar el mensaje principal.", { customLabel: "PM2" });
            console.error("[PM2 Panel] Error al editar el mensaje:", err);
            // Si falla la edición, intenta enviar uno nuevo como fallback
            try {
              message = await channel.send({
                content: [
                  "Status updated by PM2 Manager.",
                  "> Timezone: " +
                    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
                  "> Ultimate uptime: " + `<t:${Math.floor(Date.now() / 1000 - uptime)}:R>`,
                ].join("\n"),
                embeds: [embed],
                files: [{ attachment: buffer, name: "system-stats.png" }],
                components: [buttons, buttonsv2],
              });
              logWithLabel("custom", `Mensaje de fallback enviado con ID: ${message.id}`, {
                customLabel: "PM2",
              });
              configuration.messageid = message.id;
            } catch (err2) {
              logWithLabel(
                "error",
                "Error crítico: no se pudo enviar ni editar el mensaje principal.",
                { customLabel: "PM2" },
              );
              console.error("[PM2 Panel] Error crítico al enviar mensaje de fallback:", err2);
            }
          }
        }
      } catch (error: any) {
        logWithLabel("error", `Error general actualizando estado PM2: ${error.message}`, {
          customLabel: "PM2",
          context: { channelId: configuration.channelid },
        });
        console.error("[PM2 Panel] Error general:", error);
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
        const lastLines = logEntries.slice(-10);

        // Envía el contenido como archivo JSON adjunto
        const jsonBuffer = Buffer.from(JSON.stringify(lastLines, null, 2), "utf-8");

        const logsEmbed = new EmbedBuilder()
          .setTitle("📄 Latest Log Entries")
          .setDescription("Se adjunta el archivo JSON con las últimas entradas del log.")
          .addFields(
            { name: "🗂️ File", value: latestLog.filename, inline: true },
            { name: "📅 Last Modified", value: latestLog.lastModified, inline: true },
            { name: "📦 Size", value: latestLog.size, inline: true },
          )
          .setColor(0x95a5a6)
          .setTimestamp();

        await interaction.reply({
          embeds: [logsEmbed],
          files: [{ attachment: jsonBuffer, name: "latest-log.json" }],
          ephemeral: true,
        });
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
