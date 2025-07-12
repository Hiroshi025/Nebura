import {
	ChannelType, ColorResolvable, Events, Guild, OverwriteType, roleMention, TextChannel,
	userMention
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Fields } from "@typings/utils";

import { MyDiscord } from "../../client";

//TODO correjir a que solo los fields con datos se manden

/**
 * Class responsible for logging various Discord events for multiple guilds.
 */
export class LogClass {
  /**
   * The Discord client instance.
   */
  private client: MyDiscord;

  /**
   * List of guilds where the event logger is active.
   */
  private guilds: Guild[];

  /**
   * Delay in milliseconds before processing an event.
   */
  private delay: number;

  /**
   * Creates an instance of the LogClass.
   *
   * @param client - The Discord client instance.
   * @param guilds - Array of guilds where the logger will operate.
   * @param delay - Optional delay in milliseconds for event processing. Default is 500ms.
   */
  constructor(client: MyDiscord, guilds: Guild[], delay: number = 500) {
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
  public async enabled(status: boolean): Promise<boolean> {
    if (!status) return false;
    await this.registerEvents();
    return true;
  }

  /**
   * Registers event listeners for the specified guilds based on their configuration.
   *
   * @private
   * @returns A promise that resolves when all events are registered.
   */
  private async registerEvents(): Promise<boolean> {
    for (const guild of this.guilds) {
      const data = await main.prisma.myGuild.findUnique({ where: { guildId: guild.id } });
      if (!data) continue;

      // Determinar el idioma del servidor, por defecto 'es-ES'
      const lang = data.lenguage || "es-ES";
      const t = (key: string, options?: any) => this.client.translations.t(key, { lng: lang, ...options });

      const events = data.eventlogs?.events;
      if (!events) {
        console.log(`[DEBUG] No events configured for server: ${guild.id}`); // Debug log
        continue;
      }

      console.log(`[DEBUG] Registering events for server: ${guild.id}, events: ${events.join(", ")}`); // Debug log

      events.forEach((event) => {
        switch (event) {
          case "VoiceStateUpdate":
            this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
              console.log(`[DEBUG] VoiceStateUpdate event detected for user: ${newState.id}`); // Debug log
              if (oldState.guild.id !== guild.id) return; // Ensure the event is for the current guild

              if (oldState.channelId === newState.channelId) return; // Ignore if the channel hasn't changed
              if (oldState.selfMute !== newState.selfMute || oldState.selfDeaf !== newState.selfDeaf) {
                setTimeout(async () => {
                  const fields: Fields[] = [
                    {
                      name: t("eventLogger.voiceStateInfo"),
                      value: [
                        `> **${t("eventLogger.user")}:** ${userMention(newState.id)}`,
                        `> **${t("eventLogger.oldChannel")}:** ${oldState.channelId ? `<#${oldState.channelId}>` : t("eventLogger.none")}`,
                        `> **${t("eventLogger.newChannel")}:** ${newState.channelId ? `<#${newState.channelId}>` : t("eventLogger.none")}`,
                        `> **${t("eventLogger.selfMute")}:** ${newState.selfMute ? t("common.enabled") : t("common.disabled")}`,
                        `> **${t("eventLogger.selfDeaf")}:** ${newState.selfDeaf ? t("common.enabled") : t("common.disabled")}`,
                      ].join("\n"),
                      inline: false,
                    },
                  ];

                  this.send_log(
                    guild,
                    newState.selfMute || newState.selfDeaf ? "Red" : "Green",
                    t("eventLogger.voiceStateUpdate"),
                    [
                      `> **${t("eventLogger.userId")}:** \`${newState.id}\``,
                      `> **${t("eventLogger.oldChannelId")}:** \`${oldState.channelId ?? t("eventLogger.none")}\``,
                      `> **${t("eventLogger.newChannelId")}:** \`${newState.channelId ?? t("eventLogger.none")}\``,
                    ].join("\n"),
                    guild.iconURL({ forceStatic: true }) as string,
                    fields,
                  );
                }, this.delay);
              }

              if (newState.channelId && !oldState.channelId) {
                setTimeout(async () => {
                  const fields: Fields[] = [
                    {
                      name: t("eventLogger.voiceChannelInfo"),
                      value: [
                        `> **${t("eventLogger.user")}:** ${userMention(newState.id)}`,
                        `> **${t("eventLogger.channel")}:** <#${newState.channelId}>`,
                      ].join("\n"),
                      inline: false,
                    },
                  ];

                  this.send_log(
                    guild,
                    "Green",
                    t("eventLogger.voiceChannelJoin"),
                    [
                      `> **${t("eventLogger.userId")}:** \`${newState.id}\``,
                      `> **${t("eventLogger.channelId")}:** \`${newState.channelId}\``,
                    ].join("\n"),
                    guild.iconURL({ forceStatic: true }) as string,
                    fields,
                  );
                }, this.delay);
              }
            });
            break;
          case "InviteDelete":
            this.client.on(Events.InviteDelete, async (invite) => {
              console.log(`[DEBUG] InviteDelete event detected for invite: ${invite.code}`); // Debug log
              if (!invite.guild || invite.guild.id !== guild.id) return; // Ensure the event is for the current guild
              setTimeout(async () => {
                const fields: Fields[] = [
                  {
                    name: t("eventLogger.inviteInfo"),
                    value: [
                      `> **${t("eventLogger.inviteCreatedAt")}:** ${invite.createdAt ? invite.createdAt.toLocaleString() : t("eventLogger.unknown")}`,
                      `> **${t("eventLogger.inviteChannel")}:** ${invite.channel ? `${invite.channel.name} (\`${invite.channel.id}\`)` : t("eventLogger.unknown")}`,
                      `> **${t("eventLogger.inviteInviter")}:** ${userMention(invite.inviter?.id ?? t("eventLogger.unknown"))}`,
                    ].join("\n"),
                    inline: false,
                  },
                ];

                this.send_log(
                  guild,
                  "Red",
                  t("eventLogger.inviteDelete"),
                  [
                    `> **${t("eventLogger.inviteCode")}:** \`${invite.code}\``,
                    `> **${t("eventLogger.inviteUses")}:** ${invite.uses}`,
                    `> **${t("eventLogger.inviteMaxUses")}:** ${invite.maxUses ?? t("eventLogger.unlimited")}`,
                    `> **${t("eventLogger.inviteMaxAge")}:** ${invite.maxAge ? `${invite.maxAge} ${t("eventLogger.seconds")}` : t("eventLogger.noLimit")}`,
                  ].join("\n"),
                  guild.iconURL({ forceStatic: true }) as string,
                  fields,
                );
              }, this.delay);
            });
            break;
          case "InviteCreate":
            this.client.on(Events.InviteCreate, async (invite) => {
              console.log(`[DEBUG] InviteCreate event detected for invite: ${invite.code}`); // Debug log
              if (!invite.guild || invite.guild.id !== guild.id) return; // Ensure the event is for the current guild
              setTimeout(async () => {
                const fields: Fields[] = [
                  {
                    name: t("eventLogger.inviteInfo"),
                    value: [
                      `> **${t("eventLogger.inviteCreatedAt")}:** ${invite.createdAt ? invite.createdAt.toLocaleString() : t("eventLogger.unknown")}`,
                      `> **${t("eventLogger.inviteChannel")}:** ${invite.channel ? `${invite.channel.name} (\`${invite.channel.id}\`)` : t("eventLogger.unknown")}`,
                      `> **${t("eventLogger.inviteInviter")}:** ${userMention(invite.inviter?.id ?? t("eventLogger.unknown"))}`,
                    ].join("\n"),
                    inline: false,
                  },
                ];

                this.send_log(
                  guild,
                  "Green",
                  t("eventLogger.inviteCreate"),
                  [
                    `> **${t("eventLogger.inviteCode")}:** \`${invite.code}\``,
                    `> **${t("eventLogger.inviteUses")}:** ${invite.uses}`,
                    `> **${t("eventLogger.inviteMaxUses")}:** ${invite.maxUses ?? t("eventLogger.unlimited")}`,
                    `> **${t("eventLogger.inviteMaxAge")}:** ${invite.maxAge ? `${invite.maxAge} ${t("eventLogger.seconds")}` : t("eventLogger.noLimit")}`,
                  ].join("\n"),
                  guild.iconURL({ forceStatic: true }) as string,
                  fields,
                );
              }, this.delay);
            });
            break;
          case "ChannelCreate":
            this.client.on(Events.ChannelCreate, async (channel) => {
              console.log(`[DEBUG] ChannelCreate event detected for channel: ${channel.id}`); // Debug log
              if (channel.guild.id !== guild.id) return; // Ensure the event is for the current guild
              setTimeout(async () => {
                const fields: Fields[] = [
                  {
                    name: t("eventLogger.channelInfo"),
                    value: [
                      `> **${t("eventLogger.channelCreatedAt")}:** ${channel.createdAt.toLocaleString()}`,
                      `> **${t("eventLogger.voiceChannel")}:** ${channel.isVoiceBased() ? t("common.yes") : t("common.no")}`,
                      `> **${t("eventLogger.category")}:** ${channel.isThread() ? t("common.yes") : t("common.no")}`,
                    ].join("\n"),
                    inline: false,
                  },
                  {
                    name: t("eventLogger.channelViewRoles"),
                    value:
                      channel.permissionOverwrites.cache
                        .filter((perm) => perm.type === OverwriteType.Role)
                        .map((perm) => {
                          return roleMention(perm.id);
                        })
                        .join(", ") || t("eventLogger.none"),
                  },
                  {
                    name: t("eventLogger.channelViewMembers"),
                    value:
                      channel.permissionOverwrites.cache
                        .filter((perm) => perm.type === OverwriteType.Member)
                        .map((perm) => {
                          return `<@${perm.id}>`;
                        })
                        .join(", ") || t("eventLogger.none"),
                  },
                  {
                    name: t("eventLogger.permissionsChannel"),
                    value:
                      channel.permissionOverwrites.cache
                        .filter((perm) => perm.type === OverwriteType.Role)
                        .map((perm) => {
                          return `> **${roleMention(perm.id)}**: ${perm.allow.toArray().join(", ") || t("eventLogger.none")}`;
                        })
                        .join("\n") || t("eventLogger.none"),
                    inline: false,
                  },
                ];

                this.send_log(
                  guild,
                  "Green",
                  t("eventLogger.channelCreate"),
                  [
                    `> **${t("eventLogger.channelName")}:** ${channel.name} (\`${channel.id}\`)`,
                    `> **${t("eventLogger.channelType")}:** ${channel.type}`,
                    `> **${t("eventLogger.channelPosition")}:** ${channel.position}`,
                    `> **${t("eventLogger.channelParent")}:** ${channel.parentId ? channel.parentId : t("eventLogger.noParent")}`,
                  ].join("\n"),
                  guild.iconURL({ forceStatic: true }) as string,
                  fields,
                );
              }, this.delay);
            });
            break;
          case "ChannelDelete":
            this.client.on(Events.ChannelDelete, async (channel) => {
              console.log(`[DEBUG] ChannelDelete event detected for channel: ${channel.id}`); // Debug log
              if (channel.type === ChannelType.DM || !channel.guild) return;
              if (channel.guild.id !== guild.id) {
                console.log(`[DEBUG] Channel does not belong to configured server: ${guild.id}`); // Debug log
                return;
              }
              setTimeout(async () => {
                console.log(`[DEBUG] Processing ChannelDelete event for channel: ${channel.id}`); // Debug log
                const fields: Fields[] = [
                  {
                    name: t("eventLogger.channelInfo"),
                    value: [
                      `> **${t("eventLogger.channelCreatedAt")}:** ${channel.createdAt.toLocaleString()}`,
                      `> **${t("eventLogger.voiceChannel")}:** ${channel.isVoiceBased() ? t("common.yes") : t("common.no")}`,
                      `> **${t("eventLogger.category")}:** ${channel.isThread() ? t("common.yes") : t("common.no")}`,
                    ].join("\n"),
                    inline: false,
                  },
                  {
                    name: t("eventLogger.channelViewRoles"),
                    value:
                      channel.permissionOverwrites.cache
                        .filter((perm) => perm.type === OverwriteType.Role)
                        .map((perm) => {
                          return roleMention(perm.id);
                        })
                        .join(", ") || t("eventLogger.none"),
                  },
                  {
                    name: t("eventLogger.channelViewMembers"),
                    value:
                      channel.permissionOverwrites.cache
                        .filter((perm) => perm.type === OverwriteType.Member)
                        .map((perm) => {
                          return `<@${perm.id}>`;
                        })
                        .join(", ") || t("eventLogger.none"),
                  },
                ];

                this.send_log(
                  guild,
                  "Red",
                  t("eventLogger.channelDelete"),
                  [
                    `> **${t("eventLogger.channelName")}:** ${channel.name} (\`${channel.id}\`)`,
                    `> **${t("eventLogger.channelType")}:** ${channel.type}`,
                    `> **${t("eventLogger.channelPosition")}:** ${channel.position}`,
                    `> **${t("eventLogger.channelParent")}:** ${channel.parentId ? channel.parentId : t("eventLogger.noParent")}`,
                  ].join("\n"),
                  guild.iconURL({ forceStatic: true }) as string,
                  fields,
                );
              }, this.delay);
            });
            break;
          case "GuildMemberAdd":
            this.client.on(Events.GuildMemberAdd, async (member) => {
              if (member.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.memberInfo"),
                  value: [
                    `> **${t("eventLogger.memberCreatedAt")}:** ${member.user.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.memberJoinedAt")}:** ${member.joinedAt?.toLocaleString() || t("eventLogger.unknown")}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Green",
                t("eventLogger.memberAdd"),
                [
                  `> **${t("eventLogger.memberName")}:** ${member.user.username} (\`${member.user.id}\`)`,
                  `> **${t("eventLogger.memberTag")}:** ${member.user.tag}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildBanAdd":
            this.client.on(Events.GuildBanAdd, async (ban) => {
              if (ban.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.memberInfo"),
                  value: [
                    `> **${t("eventLogger.memberCreatedAt")}:** ${ban.user.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.memberBannedAt")}:** ${new Date().toLocaleString()}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Red",
                t("eventLogger.memberBan"),
                [
                  `> **${t("eventLogger.memberName")}:** ${ban.user.username} (\`${ban.user.id}\`)`,
                  `> **${t("eventLogger.memberTag")}:** ${ban.user.tag}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildBanRemove":
            this.client.on(Events.GuildBanRemove, async (ban) => {
              if (ban.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.memberInfo"),
                  value: [
                    `> **${t("eventLogger.memberCreatedAt")}:** ${ban.user.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.memberUnbannedAt")}:** ${new Date().toLocaleString()}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Green",
                t("eventLogger.memberUnban"),
                [
                  `> **${t("eventLogger.memberName")}:** ${ban.user.username} (\`${ban.user.id}\`)`,
                  `> **${t("eventLogger.memberTag")}:** ${ban.user.tag}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildMemberRemove":
            this.client.on(Events.GuildMemberRemove, async (member) => {
              if (member.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.memberInfo"),
                  value: [
                    `> **${t("eventLogger.memberCreatedAt")}:** ${member.user.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.memberLeftAt")}:** ${new Date().toLocaleString()}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Red",
                t("eventLogger.memberRemove"),
                [
                  `> **${t("eventLogger.memberName")}:** ${member.user.username} (\`${member.user.id}\`)`,
                  `> **${t("eventLogger.memberTag")}:** ${member.user.tag}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "AutoModerationRuleCreate":
            this.client.on(Events.AutoModerationRuleCreate, async (rule) => {
              if (rule.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.ruleInfo"),
                  value: [
                    `> **${t("eventLogger.creator")}:** ${userMention(rule.creatorId)} (\`${rule.creatorId}\`)`,
                    `> **${t("eventLogger.exceptions")}:** ${
                      rule.exemptRoles
                        .map((role) => {
                          return `${roleMention(role.id)}`;
                        })
                        .join(", ") || t("eventLogger.none")
                    }`,
                    `> **${t("eventLogger.actions")}:** ${
                      rule.actions
                        .map((action) => {
                          return `${action.type}`;
                        })
                        .join(", ") || t("eventLogger.none")
                    }`,
                    `> **${t("eventLogger.triggerType")}:** ${rule.triggerType}`,
                    `> **${t("eventLogger.enabled")}:** ${rule.enabled ? t("common.yes") : t("common.no")}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Green",
                t("eventLogger.autoModRuleCreate"),
                [
                  `> **${t("eventLogger.ruleName")}:** ${rule.name} (\`${rule.id}\`)`,
                  `> **${t("eventLogger.ruleType")}:** ${rule.eventType}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "AutoModerationRuleDelete":
            this.client.on(Events.AutoModerationRuleDelete, async (rule) => {
              if (rule.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.ruleInfo"),
                  value: [
                    `> **${t("eventLogger.creator")}:** ${userMention(rule.creatorId)} (\`${rule.creatorId}\`)`,
                    `> **${t("eventLogger.exceptions")}:** ${
                      rule.exemptRoles
                        .map((role) => {
                          return `${roleMention(role.id)}`;
                        })
                        .join(", ") || t("eventLogger.none")
                    }`,
                    `> **${t("eventLogger.actions")}:** ${
                      rule.actions
                        .map((action) => {
                          return `${action.type}`;
                        })
                        .join(", ") || t("eventLogger.none")
                    }`,
                    `> **${t("eventLogger.triggerType")}:** ${rule.triggerType}`,
                    `> **${t("eventLogger.enabled")}:** ${rule.enabled ? t("common.yes") : t("common.no")}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Red",
                t("eventLogger.autoModRuleDelete"),
                [
                  `> **${t("eventLogger.ruleName")}:** ${rule.name} (\`${rule.id}\`)`,
                  `> **${t("eventLogger.ruleType")}:** ${rule.eventType}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildRoleCreate":
            this.client.on(Events.GuildRoleCreate, async (role) => {
              if (role.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.roleInfo"),
                  value: [
                    `> **${t("eventLogger.roleCreatedAt")}:** ${role.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.roleColor")}:** ${role.color}`,
                    `> **${t("eventLogger.rolePosition")}:** ${role.position}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Green",
                t("eventLogger.roleCreate"),
                [
                  `> **${t("eventLogger.roleName")}:** ${role.name} (\`${role.id}\`)`,
                  `> **${t("eventLogger.rolePermissions")}:** ${role.permissions.toArray().join(", ") || t("eventLogger.none")}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildRoleDelete":
            this.client.on(Events.GuildRoleDelete, async (role) => {
              if (role.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.roleInfo"),
                  value: [
                    `> **${t("eventLogger.roleCreatedAt")}:** ${role.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.roleColor")}:** ${role.color}`,
                    `> **${t("eventLogger.rolePosition")}:** ${role.position}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Red",
                t("eventLogger.roleDelete"),
                [
                  `> **${t("eventLogger.roleName")}:** ${role.name} (\`${role.id}\`)`,
                  `> **${t("eventLogger.rolePermissions")}:** ${role.permissions.toArray().join(", ") || t("eventLogger.none")}`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildEmojiCreate":
            this.client.on(Events.GuildEmojiCreate, async (emoji) => {
              if (emoji.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.emojiInfo"),
                  value: [
                    `> **${t("eventLogger.emojiCreatedAt")}:** ${emoji.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.emojiAnimated")}:** ${emoji.animated ? t("common.yes") : t("common.no")}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Green",
                t("eventLogger.emojiCreate"),
                [
                  `> **${t("eventLogger.emojiName")}:** ${emoji.name} (\`${emoji.id}\`)`,
                  `> **${t("eventLogger.emojiUrl")}:** [${emoji.url}](https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?v=1)`,
                  `> **${t("eventLogger.emojiRoles")}:** ${
                    emoji.roles.cache
                      .map((role) => {
                        return `${roleMention(role.id)}`;
                      })
                      .join(", ") || t("eventLogger.none")
                  }`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
            });
            break;
          case "GuildEmojiDelete":
            this.client.on(Events.GuildEmojiDelete, async (emoji) => {
              if (emoji.guild.id !== guild.id) return; // Ensure the event is for the current guild
              const fields: Fields[] = [
                {
                  name: t("eventLogger.emojiInfo"),
                  value: [
                    `> **${t("eventLogger.emojiCreatedAt")}:** ${emoji.createdAt.toLocaleString()}`,
                    `> **${t("eventLogger.emojiAnimated")}:** ${emoji.animated ? t("common.yes") : t("common.no")}`,
                  ].join("\n"),
                  inline: false,
                },
              ];

              this.send_log(
                guild,
                "Red",
                t("eventLogger.emojiDelete"),
                [
                  `> **${t("eventLogger.emojiName")}:** ${emoji.name} (\`${emoji.id}\`)`,
                  `> **${t("eventLogger.emojiUrl")}:** [${emoji.url}](https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?v=1)`,
                  `> **${t("eventLogger.emojiRoles")}:** ${
                    emoji.roles.cache
                      .map((role) => {
                        return `${roleMention(role.id)}`;
                      })
                      .join(", ") || t("eventLogger.none")
                  }`,
                ].join("\n"),
                guild.iconURL({ forceStatic: true }) as string,
                fields,
              );
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
  private async send_log(
    guild: Guild,
    color: ColorResolvable,
    title: string,
    description: string,
    thumb: string,
    fields: Fields[],
  ): Promise<void> {
    try {
      if (!guild || guild?.available == false) return console.log("NO GUILD");
      // Create the embed
      const LogEmbed = new EmbedCorrect()
        .setColor(color)
        .setDescription(description ? description.substring(0, 2048) : "\u200b")
        .setTitle(title ? title.substring(0, 256) : "\u200b")
        .setTimestamp()
        .setThumbnail(
          thumb
            ? thumb
            : guild?.iconURL({
                extension: "png",
              }),
        )
        .setAuthor({
          name: guild?.name,
          iconURL: guild?.iconURL({
            extension: "png",
          }) as string,
        })
        .setFields(
          fields.map((field) => {
            return {
              name: field.name.substring(0, 256),
              value: field.value.substring(0, 1024),
              inline: field.inline ? field.inline : false,
            };
          }),
        );

      // Send the embed
      const data = await main.prisma.myGuild.findUnique({ where: { guildId: guild.id } });
      if (!data || !data.eventlogs || !data.eventlogs.channelId) return;

      const channelId = data.eventlogs.channelId;
      const channel = guild.channels.cache.get(channelId);
      if (!channel || channel.type !== ChannelType.GuildText) return; // Ensure the channel is a text channel
      (channel as TextChannel).send({ embeds: [LogEmbed] }).catch(() => {});
    } catch (e) {
      console.error("Error sending log:", e); // Added error handling
    }
  }
}
