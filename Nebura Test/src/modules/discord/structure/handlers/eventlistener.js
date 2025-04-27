"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogClass = void 0;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../main");
const embeds_extender_1 = require("../../../../structure/extenders/discord/embeds.extender");
//TODO correjir a que solo los fields con datos se manden
/**
 * Class responsible for logging various Discord events for multiple guilds.
 */
class LogClass {
    /**
     * The Discord client instance.
     */
    client;
    /**
     * List of guilds where the event logger is active.
     */
    guilds;
    /**
     * Delay in milliseconds before processing an event.
     */
    delay;
    /**
     * Creates an instance of the LogClass.
     *
     * @param client - The Discord client instance.
     * @param guilds - Array of guilds where the logger will operate.
     * @param delay - Optional delay in milliseconds for event processing. Default is 500ms.
     */
    constructor(client, guilds, delay = 500) {
        this.client = client;
        this.guilds = guilds;
        this.delay = delay;
    }
    /**
     * Enables or disables the event logger.
     *
     * @param status - Boolean indicating whether to enable or disable the logger.
     * @returns A promise that resolves to `true` if enabled, otherwise `false`.
     */
    async enabled(status) {
        if (!status)
            return false;
        await this.registerEvents();
        return true;
    }
    /**
     * Registers event listeners for the specified guilds based on their configuration.
     *
     * @private
     * @returns A promise that resolves when all events are registered.
     */
    async registerEvents() {
        for (const guild of this.guilds) {
            const data = await main_1.main.prisma.myGuild.findUnique({ where: { guildId: guild.id } });
            if (!data)
                continue;
            const events = data.eventlogs?.events;
            if (!events) {
                console.log(`[DEBUG] No hay eventos configurados para el servidor: ${guild.id}`); // Log de depuración
                continue;
            }
            console.log(`[DEBUG] Registrando eventos para el servidor: ${guild.id}, eventos: ${events.join(", ")}`); // Log de depuración
            events.forEach((event) => {
                switch (event) {
                    case discord_js_1.Events.ChannelCreate:
                        this.client.on(discord_js_1.Events.ChannelCreate, async (channel) => {
                            console.log(`[DEBUG] Evento ChannelCreate detectado para el canal: ${channel.id}`); // Log de depuración
                            if (channel.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            setTimeout(async () => {
                                const fields = [
                                    {
                                        name: "__Channel Information__",
                                        value: [
                                            `> **Channel Created At:** ${channel.createdAt.toLocaleString()}`,
                                            `> **Voice Channel:** ${channel.isVoiceBased() ? "Yes" : "No"}`,
                                            `> **Category:** ${channel.isThread() ? "Yes" : "No"}`,
                                        ].join("\n"),
                                        inline: false,
                                    },
                                    {
                                        name: "__Channel View Roles__",
                                        value: channel.permissionOverwrites.cache
                                            .filter((perm) => perm.type === discord_js_1.OverwriteType.Role)
                                            .map((perm) => {
                                            return (0, discord_js_1.roleMention)(perm.id);
                                        })
                                            .join(", "),
                                    },
                                    {
                                        name: "__Channel View Members__",
                                        value: channel.permissionOverwrites.cache
                                            .filter((perm) => perm.type === discord_js_1.OverwriteType.Member)
                                            .map((perm) => {
                                            return `<@${perm.id}>`;
                                        })
                                            .join(", "),
                                    },
                                    {
                                        name: "__Permissions Channel__",
                                        value: channel.permissionOverwrites.cache
                                            .filter((perm) => perm.type === discord_js_1.OverwriteType.Role)
                                            .map((perm) => {
                                            return `> **${(0, discord_js_1.roleMention)(perm.id)}**: ${perm.allow.toArray().join(", ")}`;
                                        })
                                            .join("\n"),
                                        inline: false,
                                    },
                                ];
                                this.send_log(guild, "Green", "Events Logger - Channel Create", [
                                    `> **Channel Name:** ${channel.name} (\`${channel.id}\`)`,
                                    `> **Channel Type:** ${channel.type}`,
                                    `> **Channel Position:** ${channel.position}`,
                                    `> **Channel Parent:** ${channel.parentId ? channel.parentId : "No Parent"}`,
                                ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                            }, this.delay);
                        });
                        break;
                    case discord_js_1.Events.ChannelDelete:
                        this.client.on(discord_js_1.Events.ChannelDelete, async (channel) => {
                            console.log(`[DEBUG] Evento ChannelDelete detectado para el canal: ${channel.id}`); // Log de depuración
                            if (channel.type === discord_js_1.ChannelType.DM || !channel.guild)
                                return;
                            if (channel.guild.id !== guild.id) {
                                console.log(`[DEBUG] El canal no pertenece al servidor configurado: ${guild.id}`); // Log de depuración
                                return;
                            }
                            setTimeout(async () => {
                                console.log(`[DEBUG] Procesando evento ChannelDelete para el canal: ${channel.id}`); // Log de depuración
                                const fields = [
                                    {
                                        name: "__Channel Information__",
                                        value: [
                                            `> **Channel Created At:** ${channel.createdAt.toLocaleString()}`,
                                            `> **Voice Channel:** ${channel.isVoiceBased() ? "Yes" : "No"}`,
                                            `> **Category:** ${channel.isThread() ? "Yes" : "No"}`,
                                        ].join("\n"),
                                        inline: false,
                                    },
                                    {
                                        name: "__Channel View Roles__",
                                        value: channel.permissionOverwrites.cache
                                            .filter((perm) => perm.type === discord_js_1.OverwriteType.Role)
                                            .map((perm) => {
                                            return (0, discord_js_1.roleMention)(perm.id);
                                        })
                                            .join(", "),
                                    },
                                    {
                                        name: "__Channel View Members__",
                                        value: channel.permissionOverwrites.cache
                                            .filter((perm) => perm.type === discord_js_1.OverwriteType.Member)
                                            .map((perm) => {
                                            return `<@${perm.id}>`;
                                        })
                                            .join(", "),
                                    },
                                ];
                                this.send_log(guild, "Red", "Events Logger - Channel Delete", [
                                    `> **Channel Name:** ${channel.name} (\`${channel.id}\`)`,
                                    `> **Channel Type:** ${channel.type}`,
                                    `> **Channel Position:** ${channel.position}`,
                                    `> **Channel Parent:** ${channel.parentId ? channel.parentId : "No Parent"}`,
                                ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                            }, this.delay);
                        });
                        break;
                    case discord_js_1.Events.GuildMemberAdd:
                        this.client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
                            if (member.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Member Information__",
                                    value: [
                                        `> **Member Created At:** ${member.user.createdAt.toLocaleString()}`,
                                        `> **Member Joined At:** ${member.joinedAt?.toLocaleString()}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Green", "Events Logger - Member Add", [
                                `> **Member Name:** ${member.user.username} (\`${member.user.id}\`)`,
                                `> **Member Tag:** ${member.user.tag}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildBanAdd:
                        this.client.on(discord_js_1.Events.GuildBanAdd, async (ban) => {
                            if (ban.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Member Information__",
                                    value: [
                                        `> **Member Created At:** ${ban.user.createdAt.toLocaleString()}`,
                                        `> **Member Banned At:** ${new Date().toLocaleString()}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Red", "Events Logger - Member Ban", [
                                `> **Member Name:** ${ban.user.username} (\`${ban.user.id}\`)`,
                                `> **Member Tag:** ${ban.user.tag}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildBanRemove:
                        this.client.on(discord_js_1.Events.GuildBanRemove, async (ban) => {
                            if (ban.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Member Information__",
                                    value: [
                                        `> **Member Created At:** ${ban.user.createdAt.toLocaleString()}`,
                                        `> **Member Unbanned At:** ${new Date().toLocaleString()}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Green", "Events Logger - Member Unban", [
                                `> **Member Name:** ${ban.user.username} (\`${ban.user.id}\`)`,
                                `> **Member Tag:** ${ban.user.tag}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildMemberRemove:
                        this.client.on(discord_js_1.Events.GuildMemberRemove, async (member) => {
                            if (member.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Member Information__",
                                    value: [
                                        `> **Member Created At:** ${member.user.createdAt.toLocaleString()}`,
                                        `> **Member Left At:** ${new Date().toLocaleString()}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Red", "Events Logger - Member Remove", [
                                `> **Member Name:** ${member.user.username} (\`${member.user.id}\`)`,
                                `> **Member Tag:** ${member.user.tag}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.AutoModerationRuleCreate:
                        this.client.on(discord_js_1.Events.AutoModerationRuleCreate, async (rule) => {
                            if (rule.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Rule Information__",
                                    value: [
                                        `> **Creator:** ${(0, discord_js_1.userMention)(rule.creatorId)} (\`${rule.creatorId}\`)`,
                                        `> **Exeptions:** ${rule.exemptRoles
                                            .map((role) => {
                                            return `${(0, discord_js_1.roleMention)(role.id)}`;
                                        })
                                            .join(", ")}`,
                                        `> **Actions:** ${rule.actions
                                            .map((action) => {
                                            return `${action.type}`;
                                        })
                                            .join(", ")}`,
                                        `> **Trigger Type:** ${rule.triggerType}`,
                                        `> **Enabled:** ${rule.enabled ? "Yes" : "No"}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Green", "Events Logger - Auto Moderation Rule Create", [
                                `> **Rule Name:** ${rule.name} (\`${rule.id}\`)`,
                                `> **Rule Type:** ${rule.eventType}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.AutoModerationRuleDelete:
                        this.client.on(discord_js_1.Events.AutoModerationRuleDelete, async (rule) => {
                            if (rule.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Rule Information__",
                                    value: [
                                        `> **Creator:** ${(0, discord_js_1.userMention)(rule.creatorId)} (\`${rule.creatorId}\`)`,
                                        `> **Exeptions:** ${rule.exemptRoles
                                            .map((role) => {
                                            return `${(0, discord_js_1.roleMention)(role.id)}`;
                                        })
                                            .join(", ")}`,
                                        `> **Actions:** ${rule.actions
                                            .map((action) => {
                                            return `${action.type}`;
                                        })
                                            .join(", ")}`,
                                        `> **Trigger Type:** ${rule.triggerType}`,
                                        `> **Enabled:** ${rule.enabled ? "Yes" : "No"}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Red", "Events Logger - Auto Moderation Rule Delete", [
                                `> **Rule Name:** ${rule.name} (\`${rule.id}\`)`,
                                `> **Rule Type:** ${rule.eventType}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildRoleCreate:
                        this.client.on(discord_js_1.Events.GuildRoleCreate, async (role) => {
                            if (role.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Role Information__",
                                    value: [
                                        `> **Role Created At:** ${role.createdAt.toLocaleString()}`,
                                        `> **Role Color:** ${role.color}`,
                                        `> **Role Position:** ${role.position}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Green", "Events Logger - Role Create", [
                                `> **Role Name:** ${role.name} (\`${role.id}\`)`,
                                `> **Role Permissions:** ${role.permissions.toArray().join(", ")}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildRoleDelete:
                        this.client.on(discord_js_1.Events.GuildRoleDelete, async (role) => {
                            if (role.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Role Information__",
                                    value: [
                                        `> **Role Created At:** ${role.createdAt.toLocaleString()}`,
                                        `> **Role Color:** ${role.color}`,
                                        `> **Role Position:** ${role.position}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Red", "Events Logger - Role Delete", [
                                `> **Role Name:** ${role.name} (\`${role.id}\`)`,
                                `> **Role Permissions:** ${role.permissions.toArray().join(", ")}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildEmojiCreate:
                        this.client.on(discord_js_1.Events.GuildEmojiCreate, async (emoji) => {
                            if (emoji.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Emoji Information__",
                                    value: [
                                        `> **Emoji Created At:** ${emoji.createdAt.toLocaleString()}`,
                                        `> **Emoji Animated:** ${emoji.animated ? "Yes" : "No"}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Green", "Events Logger - Emoji Create", [
                                `> **Emoji Name:** ${emoji.name} (\`${emoji.id}\`)`,
                                `> **Emoji URL:** [
                    ${emoji.url}](https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?v=1)`,
                                `> **Emoji Roles:** ${emoji.roles.cache
                                    .map((role) => {
                                    return `${(0, discord_js_1.roleMention)(role.id)}`;
                                })
                                    .join(", ")}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                    case discord_js_1.Events.GuildEmojiDelete:
                        this.client.on(discord_js_1.Events.GuildEmojiDelete, async (emoji) => {
                            if (emoji.guild.id !== guild.id)
                                return; // Ensure the event is for the current guild
                            const fields = [
                                {
                                    name: "__Emoji Information__",
                                    value: [
                                        `> **Emoji Created At:** ${emoji.createdAt.toLocaleString()}`,
                                        `> **Emoji Animated:** ${emoji.animated ? "Yes" : "No"}`,
                                    ].join("\n"),
                                    inline: false,
                                },
                            ];
                            this.send_log(guild, "Red", "Events Logger - Emoji Delete", [
                                `> **Emoji Name:** ${emoji.name} (\`${emoji.id}\`)`,
                                `> **Emoji URL:** [
                    ${emoji.url}](https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?v=1)`,
                                `> **Emoji Roles:** ${emoji.roles.cache
                                    .map((role) => {
                                    return `${(0, discord_js_1.roleMention)(role.id)}`;
                                })
                                    .join(", ")}`,
                            ].join("\n"), guild.iconURL({ forceStatic: true }), fields);
                        });
                        break;
                }
            });
        }
        return true;
    }
    /**
     * Sends a log message to the configured log channel of a guild.
     *
     * @private
     * @param guild - The guild where the log will be sent.
     * @param color - The color of the embed.
     * @param title - The title of the embed.
     * @param description - The description of the embed.
     * @param thumb - The thumbnail URL for the embed.
     * @param fields - Array of fields to include in the embed.
     */
    async send_log(guild, color, title, description, thumb, fields) {
        try {
            if (!guild || guild?.available == false)
                return console.log("NO GUILD");
            // Create the embed
            const LogEmbed = new embeds_extender_1.EmbedCorrect()
                .setColor(color)
                .setDescription(description ? description.substring(0, 2048) : "\u200b")
                .setTitle(title ? title.substring(0, 256) : "\u200b")
                .setTimestamp()
                .setThumbnail(thumb
                ? thumb
                : guild?.iconURL({
                    extension: "png",
                }))
                .setAuthor({
                name: guild?.name,
                iconURL: guild?.iconURL({
                    extension: "png",
                }),
            })
                .setFields(fields.map((field) => {
                return {
                    name: field.name.substring(0, 256),
                    value: field.value.substring(0, 1024),
                    inline: field.inline ? field.inline : false,
                };
            }));
            // Send the embed
            const data = await main_1.main.prisma.myGuild.findUnique({ where: { guildId: guild.id } });
            if (!data || !data.eventlogs || !data.eventlogs.channelId)
                return;
            const channelId = data.eventlogs.channelId;
            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
                return; // Ensure the channel is a text channel
            channel.send({ embeds: [LogEmbed] }).catch(() => { });
        }
        catch (e) {
            console.error("Error sending log:", e); // Added error handling
        }
    }
}
exports.LogClass = LogClass;
