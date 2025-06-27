"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0671e381-f660-5a9d-b267-058e374e57ac")}catch(e){}}();

const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const roleInfo = {
    name: "roleinfo",
    description: "Shows detailed information about a role with interactive components",
    examples: ["roleinfo @Moderator", "roleinfo Admins", "/roleinfo role: Moderator"],
    nsfw: false,
    owner: false,
    aliases: ["r-info", "role-info"],
    botpermissions: ["SendMessages", "EmbedLinks", "ManageMessages"],
    permissions: ["SendMessages"],
    async execute(_client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        try {
            const roleName = args.join(" ");
            if (!roleName) {
                return message.reply({
                    content: "❌ Please specify a role name or mention.",
                    allowedMentions: { repliedUser: false },
                });
            }
            // Find the role
            const role = message.mentions.roles.first() ||
                message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
            if (!role || !(role instanceof discord_js_1.Role)) {
                return message.reply({
                    content: "❌ Role not found or invalid. Please check the name and try again.",
                    allowedMentions: { repliedUser: false },
                });
            }
            // Fetch members for accurate count
            await message.guild.members.fetch();
            // Create the main embed
            const mainEmbed = createMainRoleEmbed(role);
            // Create buttons
            const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("permissions")
                .setLabel("View Permissions")
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji("🔑"), new discord_js_1.ButtonBuilder()
                .setCustomId("members")
                .setLabel(`View Members (${role.members.size})`)
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji("👥"), new discord_js_1.ButtonBuilder()
                .setCustomId("compare")
                .setLabel("Compare to My Roles")
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setDisabled(true)
                .setEmoji("⚖️"), new discord_js_1.ButtonBuilder().setCustomId("delete").setLabel("Delete").setStyle(discord_js_1.ButtonStyle.Danger).setEmoji("🗑️"));
            // Send the initial message
            const infoMessage = await message.reply({
                embeds: [mainEmbed],
                components: [buttons],
                allowedMentions: { repliedUser: false },
            });
            // Create a collector for interactions
            const collector = infoMessage.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.Button,
                time: 300_000, // 5 minutes
            });
            collector.on("collect", async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "❌ This interaction is not for you!",
                        flags: "Ephemeral",
                    });
                }
                try {
                    switch (interaction.customId) {
                        case "permissions":
                            await handlePermissions(interaction, role);
                            break;
                        case "members":
                            await handleMembers(interaction, role);
                            break;
                        case "compare":
                            await handleCompare(interaction, role, message.member);
                            break;
                        case "delete":
                            await infoMessage.delete();
                            break;
                    }
                }
                catch (error) {
                    console.error("Error handling interaction:", error);
                    await interaction.reply({
                        content: "❌ An error occurred while processing your request.",
                        flags: "Ephemeral",
                    });
                }
                return;
            });
            collector.on("end", () => {
                infoMessage.edit({ components: [] }).catch(() => { });
            });
        }
        catch (error) {
            console.error("Error in roleinfo command:", error);
            message
                .reply({
                content: "❌ An error occurred while fetching role information.",
                allowedMentions: { repliedUser: false },
            })
                .catch(() => { });
        }
        return;
    },
};
// Helper functions
function createMainRoleEmbed(role) {
    return new embeds_extend_1.EmbedCorrect()
        .setColor(role.color || "#2b2d31")
        .setTitle(`Role Information: ${role.name}`)
        .setThumbnail(role.iconURL({ size: 4096 }))
        .addFields({ name: "🆔 ID", value: role.id, inline: true }, { name: "🎨 Color", value: role.hexColor, inline: true }, { name: "📊 Position", value: `#${role.position}`, inline: true }, { name: "👥 Members", value: role.members.size.toString(), inline: true }, {
        name: "📅 Created",
        value: (0, discord_js_1.time)(Math.floor(role.createdTimestamp / 1000), "R"),
        inline: true,
    }, { name: "🔝 Hoisted", value: role.hoist ? "✅ Yes" : "❌ No", inline: true }, { name: "🔔 Mentionable", value: role.mentionable ? "✅ Yes" : "❌ No", inline: true }, { name: "🤖 Managed", value: role.managed ? "✅ Yes" : "❌ No", inline: true }, { name: "🛡️ Permissions", value: `Click the "View Permissions" button below`, inline: false })
        .setFooter({ text: "Use the buttons below for more information" });
}
async function handlePermissions(interaction, role) {
    const permissions = role.permissions.toArray();
    const permissionChunks = chunkArray(permissions, 10);
    const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("permission_page")
        .setPlaceholder("Select a permission category")
        .addOptions({
        label: "General Permissions",
        value: "general",
        description: "View general server permissions",
    }, {
        label: "Membership Permissions",
        value: "membership",
        description: "View member management permissions",
    }, {
        label: "Text Permissions",
        value: "text",
        description: "View text channel permissions",
    }, {
        label: "Voice Permissions",
        value: "voice",
        description: "View voice channel permissions",
    }, {
        label: "Stage Permissions",
        value: "stage",
        description: "View stage channel permissions",
    }));
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(role.color || "#2b2d31")
        .setTitle(`Permissions for ${role.name}`)
        .setDescription(permissions.length > 0
        ? `**Total Permissions:** ${permissions.length}\n\n` +
            permissionChunks[0].map((p) => `• ${formatPermission(p)}`).join("\n")
        : "This role has no special permissions.")
        .setFooter({ text: `Page 1/${permissionChunks.length}` });
    await interaction.reply({
        embeds: [embed],
        components: [selectMenu],
        flags: "Ephemeral",
    });
    // Handle select menu interaction
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: discord_js_1.ComponentType.StringSelect,
        time: 60000,
    });
    collector.on("collect", async (i) => {
        if (i.customId === "permission_page") {
            const category = i.values[0];
            let filteredPermissions = [];
            switch (category) {
                case "general":
                    filteredPermissions = permissions.filter((p) => (Object.values(discord_js_1.PermissionFlagsBits).includes(p) && p.startsWith("Administrator")) ||
                        p.startsWith("Manage") ||
                        p.startsWith("View"));
                    break;
                case "membership":
                    filteredPermissions = permissions.filter((p) => p.includes("Member") || p.includes("Nickname") || p.includes("Ban") || p.includes("Kick"));
                    break;
                case "text":
                    filteredPermissions = permissions.filter((p) => p.includes("Message") || p.includes("Embed") || p.includes("Channel") || p.includes("Thread"));
                    break;
                case "voice":
                    filteredPermissions = permissions.filter((p) => p.includes("Voice") || p.includes("Speak") || p.includes("Stream"));
                    break;
                case "stage":
                    filteredPermissions = permissions.filter((p) => p.includes("Stage") || p.includes("RequestToSpeak"));
                    break;
            }
            const updatedEmbed = new discord_js_1.EmbedBuilder()
                .setColor(role.color || "#2b2d31")
                .setTitle(`Permissions for ${role.name} (${category})`)
                .setDescription(filteredPermissions.length > 0
                ? filteredPermissions.map((p) => `• ${formatPermission(p)}`).join("\n")
                : `No ${category} permissions found for this role.`);
            await i.update({ embeds: [updatedEmbed] });
        }
    });
}
async function handleMembers(interaction, role) {
    const members = role.members;
    if (members.size === 0) {
        return interaction.reply({
            content: `❌ There are no members with the ${role.name} role.`,
            flags: "Ephemeral",
        });
    }
    const memberList = members.map((m) => `• ${m.user.tag} (${m.user.id})`).join("\n");
    const memberChunks = chunkArray(memberList.split("\n"), 10);
    let currentPage = 0;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(role.color || "#2b2d31")
        .setTitle(`Members with ${role.name} role (${members.size})`)
        .setDescription(memberChunks[currentPage].join("\n"))
        .setFooter({ text: `Page ${currentPage + 1}/${memberChunks.length}` });
    const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("prev").setLabel("Previous").setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true), new discord_js_1.ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(memberChunks.length <= 1), new discord_js_1.ButtonBuilder().setCustomId("close").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
    const reply = await interaction.reply({
        embeds: [embed],
        components: [buttons],
        flags: "Ephemeral",
    });
    const collector = reply.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 300000,
    });
    collector.on("collect", async (i) => {
        if (i.customId === "prev" && currentPage > 0) {
            currentPage--;
        }
        else if (i.customId === "next" && currentPage < memberChunks.length - 1) {
            currentPage++;
        }
        else if (i.customId === "close") {
            collector.stop();
            return i.update({ components: [] });
        }
        buttons.components[0].setDisabled(currentPage === 0);
        buttons.components[1].setDisabled(currentPage === memberChunks.length - 1);
        const updatedEmbed = new discord_js_1.EmbedBuilder()
            .setColor(role.color || "#2b2d31")
            .setTitle(`Members with ${role.name} role (${members.size})`)
            .setDescription(memberChunks[currentPage].join("\n"))
            .setFooter({ text: `Page ${currentPage + 1}/${memberChunks.length}` });
        await i.update({ embeds: [updatedEmbed], components: [buttons] });
    });
    collector.on("end", () => {
        reply.edit({ components: [] }).catch(() => { });
    });
}
async function handleCompare(interaction, role, member) {
    if (!role || typeof role.comparePositionTo !== "function") {
        return interaction.reply({
            content: "❌ The role provided is invalid or could not be found.",
            flags: "Ephemeral",
        });
    }
    const memberRoles = member.roles.cache;
    const hasRole = memberRoles.has(role.id);
    const higherThanUser = role.comparePositionTo(memberRoles.highest) > 0;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(role.color || "#2b2d31")
        .setTitle(`Role Comparison: ${role.name}`)
        .addFields({
        name: "You have this role",
        value: hasRole ? "✅ Yes" : "❌ No",
        inline: true,
    }, {
        name: "Role is higher than yours",
        value: higherThanUser ? "✅ Yes" : "❌ No",
        inline: true,
    }, {
        name: "Your permissions vs role",
        value: "See below for detailed comparison",
        inline: false,
    });
    // Compare permissions
    const memberPermissions = new discord_js_1.PermissionsBitField(member.permissions);
    const rolePermissions = role.permissions;
    const missingPermissions = rolePermissions.missing(memberPermissions);
    const extraPermissions = memberPermissions.missing(rolePermissions);
    if (missingPermissions.length > 0) {
        embed.addFields({
            name: "❌ Permissions you don't have",
            value: missingPermissions.map((p) => `• ${formatPermission(p)}`).join("\n"),
            inline: false,
        });
    }
    if (extraPermissions.length > 0) {
        embed.addFields({
            name: "✅ Permissions you have but role doesn't",
            value: extraPermissions.map((p) => `• ${formatPermission(p)}`).join("\n"),
            inline: false,
        });
    }
    if (missingPermissions.length === 0 && extraPermissions.length === 0) {
        embed.addFields({
            name: "🔹 Permissions",
            value: "You have exactly the same permissions as this role",
            inline: false,
        });
    }
    await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
}
// Utility functions
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function formatPermission(permission) {
    return permission
        .split(/(?=[A-Z])/)
        .join(" ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}
module.exports = roleInfo;
//# sourceMappingURL=role.js.map
//# debugId=0671e381-f660-5a9d-b267-058e374e57ac
