"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const main_1 = require("../../../main");
const addons_1 = require("../../../modules/discord/structure/addons");
const PM2_1 = require("../../../shared/class/PM2");
const console_1 = require("../../../shared/utils/functions/console");
const pm2Manager = new PM2_1.PM2Manager();
exports.default = new addons_1.Addons({
    name: "PM2 Manager",
    description: "Interactive PM2 process manager for Discord.",
    author: "Hiroshi025",
    version: "1.1.0",
    bitfield: ["Administrator"],
}, async () => {
    const configuration = {
        enabled: true,
        channelid: "1357948378377486387", // Channel ID where the message will be sent
        messageid: "1364149650726326293", // Message ID to edit
    };
    async function updatePM2Status() {
        try {
            const processes = await pm2Manager.listProcesses();
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("PM2 Process Monitor")
                .setColor(0x00ff00)
                .setDescription("Current status of PM2-managed processes.")
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
            const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("reset_all")
                .setLabel("Restart All")
                .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
                .setCustomId("get_info")
                .setLabel("Get Process Info")
                .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                .setCustomId("stop_process")
                .setLabel("Stop Process")
                .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
                .setCustomId("start_process")
                .setLabel("Start Process")
                .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
                .setCustomId("delete_process")
                .setLabel("Delete Process")
                .setStyle(discord_js_1.ButtonStyle.Danger));
            const channel = (await main_1.main.discord.channels.fetch(configuration.channelid));
            if (!channel?.isTextBased())
                throw new Error("Invalid channel.");
            let message = await channel.messages.fetch(configuration.messageid).catch(() => null);
            if (!message || message.author !== main_1.client.user) {
                (0, console_1.logWithLabel)("custom", "Message not found, sending a new one.", "PM2 Manager");
                message = await channel.send({
                    content: "Status updated by PM2 Manager.",
                    embeds: [embed],
                    components: [buttons],
                });
                configuration.messageid = message.id;
            }
            else {
                await message.edit({
                    content: "Status updated by PM2 Manager.",
                    embeds: [embed],
                    components: [buttons],
                });
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Error updating PM2 status: ${error.message}`, "PM2 Manager");
        }
    }
    async function handleButtonInteraction(interaction) {
        if (!interaction.channel ||
            !interaction.guild ||
            interaction.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const customId = interaction.customId;
        if (customId === "reset_all") {
            await pm2Manager.restartProcess("all");
            await interaction.reply("All processes have been restarted.");
        }
        else if (customId === "get_info") {
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
                    const infoEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(`Process Info: ${processInfo.name}`)
                        .setColor(0x00ff00)
                        .addFields({ name: "Status", value: processInfo.status, inline: true }, { name: "CPU", value: `${processInfo.cpu}%`, inline: true }, {
                        name: "Memory",
                        value: `${(processInfo.memory / 1024 / 1024).toFixed(2)} MB`,
                        inline: true,
                    }, {
                        name: "Uptime",
                        value: `${Math.floor(processInfo.uptime / 1000)}s`,
                        inline: true,
                    }, { name: "Restarts", value: `${processInfo.restart_time}`, inline: true })
                        .setTimestamp();
                    await msg.reply({ embeds: [infoEmbed] });
                }
                else {
                    await msg.reply("Process not found.");
                }
            });
        }
        else if (customId === "stop_process") {
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
        }
        else if (customId === "start_process") {
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
        }
        else if (customId === "delete_process") {
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
        }
    }
    if (configuration.enabled) {
        updatePM2Status();
        setInterval(updatePM2Status, 5 * 60 * 1000); // Update every 5 minutes
        main_1.main.discord.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton())
                return;
            await handleButtonInteraction(interaction);
        });
    }
    else {
        (0, console_1.logWithLabel)("custom", "PM2 Manager is disabled.", "PM2 Manager");
    }
});
