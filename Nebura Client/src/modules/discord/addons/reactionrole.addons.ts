import {
	ChannelType, Events, MessageReaction, PartialMessageReaction, PartialUser, User
} from "discord.js";

import { main } from "@/main";
import { Addons } from "@/modules/discord/structure/addons";
import { ReactionRoleData } from "@typings/modules/discord";

export default new Addons(
  {
    name: "Reaction Role Manager",
    description: "Manage roles based on reactions.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["ManageGuild"],
  },
  async (client) => {
    // ADDING ROLES
    client.on(
      Events.MessageReactionAdd,
      async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        try {
          console.log("[DEBUG] MessageReactionAdd event triggered");

          const { message } = reaction;
          if (
            user.bot ||
            !message.guild ||
            !message.channel ||
            message.channel.type !== ChannelType.GuildText
          )
            return;

          // Fetch partial data if needed
          if (message.partial) {
            console.log("[DEBUG] Fetching partial message");
            await message.fetch().catch(() => {});
          }
          if (reaction.partial) {
            console.log("[DEBUG] Fetching partial reaction");
            await reaction.fetch().catch(() => {});
          }

          // Get or create reaction roles for this guild
          console.log(`[DEBUG] Getting reaction roles for guild ${message.guild.id}`);
          const guildId = message.guild.id;
          let reactionSetup = await main.prisma.reactionRole.findMany({
            where: { guildId },
          });

          if (!reactionSetup || reactionSetup.length === 0) {
            console.log("[DEBUG] No reaction roles setup for this guild");
            return;
          }

          for (const setup of reactionSetup) {
            if (message.id === setup.messageId) {
              console.log(`[DEBUG] Found matching reaction role setup for message ${message.id}`);

              const member = await message.guild.members.fetch(user.id).catch(() => {});
              if (!member) {
                console.log("[DEBUG] Couldn't fetch member");
                return;
              }

              const parameters = setup.parameters as unknown as ReactionRoleData["Parameters"];
              let currentRole: string | null = null;

              for (const param of parameters) {
                if (reaction.emoji?.id === param.Emoji || reaction.emoji?.name === param.Emoji) {
                  console.log(`[DEBUG] Matched emoji ${param.Emoji} with role ${param.Role}`);
                  try {
                    currentRole = param.Role;
                    const guildRole = message.guild.roles.cache.get(param.Role);

                    if (guildRole) {
                      const botHighestRole = message.guild.members.me?.roles.highest;
                      if (botHighestRole && botHighestRole.rawPosition > guildRole.rawPosition) {
                        if (!member.roles.cache.has(param.Role)) {
                          console.log(
                            `[DEBUG] Adding role ${guildRole.name} to member ${member.user.tag}`,
                          );
                          await member.roles.add(param.Role).catch(() => {});
                        }
                      } else {
                        console.log(`[DEBUG] Role ${guildRole.name} is above bot's highest role`);
                        const msg = await message.channel
                          .send("The Role is above my highest Role, I can't give it to you!")
                          .catch(() => {});
                        if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                      }
                    } else {
                      console.log(`[DEBUG] Role ${param.Role} not found in guild`);
                      const msg = await message.channel
                        .send("This Role got deleted, I can't give it to you!")
                        .catch(() => {});
                      if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                    }
                  } catch (error) {
                    console.error("[ERROR] Error adding role:", error);
                    const msg = await message.channel
                      .send({
                        content: `\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``,
                      })
                      .catch(() => {});
                    if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                  }
                }
              }

              if (setup.removeOthers) {
                console.log("[DEBUG] remove_others is true, removing other reactions and roles");

                // Remove other reactions
                await message.fetch().catch(() => {});
                const userReactions = message.reactions.cache;

                try {
                  for (const otherReaction of userReactions.values()) {
                    if (
                      otherReaction.users.cache.has(user.id) &&
                      (reaction.emoji?.name !== otherReaction.emoji?.name ||
                        reaction.emoji?.id !== otherReaction.emoji?.id)
                    ) {
                      console.log(`[DEBUG] Removing other reaction ${otherReaction.emoji?.name}`);
                      await otherReaction.users.remove(user.id).catch(() => {});
                    }
                  }
                } catch (error) {
                  console.error("[ERROR] Error removing reactions:", error);
                }

                // Remove other roles
                for (const param of parameters) {
                  try {
                    if (param.Role !== currentRole) {
                      const guildRole = message.guild.roles.cache.get(param.Role);
                      if (guildRole) {
                        const botHighestRole = message.guild.members.me?.roles.highest;
                        if (botHighestRole && botHighestRole.rawPosition > guildRole.rawPosition) {
                          if (member.roles.cache.has(param.Role)) {
                            console.log(
                              `[DEBUG] Removing role ${guildRole.name} from member ${member.user.tag}`,
                            );
                            await member.roles.remove(param.Role).catch(() => {});
                          }
                        } else {
                          console.log(`[DEBUG] Role ${guildRole.name} is above bot's highest role`);
                          const msg = await message.channel
                            .send("The Role is above my highest Role, I can't remove it from you!")
                            .catch(() => {});
                          if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                        }
                      } else {
                        console.log(`[DEBUG] Role ${param.Role} not found in guild`);
                        const msg = await message.channel
                          .send("This Role got deleted, I can't remove it from you!")
                          .catch(() => {});
                        if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                      }
                    }
                  } catch (error) {
                    console.error("[ERROR] Error removing role:", error);
                    const msg = await message.channel
                      .send({
                        content: `\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``,
                      })
                      .catch(() => {});
                    if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("[ERROR] In MessageReactionAdd:", e instanceof Error ? e.stack : String(e));
        }
      },
    );

    // REMOVING ROLES
    client.on(
      Events.MessageReactionRemove,
      async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        try {
          console.log("[DEBUG] MessageReactionRemove event triggered");

          if (reaction.message.partial) {
            console.log("[DEBUG] Fetching partial message");
            await reaction.message.fetch().catch(() => {});
          }
          if (reaction.partial) {
            console.log("[DEBUG] Fetching partial reaction");
            await reaction.fetch().catch(() => {});
          }
          if (user.bot) return;
          if (
            !reaction.message.guild ||
            !reaction.message.channel ||
            reaction.message.channel.type !== ChannelType.GuildText
          )
            return;

          console.log(`[DEBUG] Getting reaction roles for guild ${reaction.message.guild.id}`);
          const guildId = reaction.message.guild.id;
          const reactionSetup = await main.prisma.reactionRole.findMany({
            where: { guildId },
          });

          for (const setup of reactionSetup) {
            if (reaction.message.id === setup.messageId) {
              console.log(
                `[DEBUG] Found matching reaction role setup for message ${reaction.message.id}`,
              );

              const member = await reaction.message.guild.members.fetch(user.id).catch(() => {});
              if (!member) {
                console.log("[DEBUG] Couldn't fetch member");
                return;
              }

              const parameters = setup.parameters as unknown as ReactionRoleData["Parameters"];

              for (const param of parameters) {
                if (reaction.emoji?.id === param.Emoji || reaction.emoji?.name === param.Emoji) {
                  console.log(`[DEBUG] Matched emoji ${param.Emoji} with role ${param.Role}`);
                  try {
                    const guildRole = reaction.message.guild.roles.cache.get(param.Role);
                    if (guildRole) {
                      const botHighestRole = reaction.message.guild.members.me?.roles.highest;
                      if (botHighestRole && botHighestRole.rawPosition > guildRole.rawPosition) {
                        if (member.roles.cache.has(param.Role)) {
                          console.log(
                            `[DEBUG] Removing role ${guildRole.name} from member ${member.user.tag}`,
                          );
                          await member.roles.remove(param.Role).catch(() => {});
                        }
                      } else {
                        console.log(`[DEBUG] Role ${guildRole.name} is above bot's highest role`);
                        const msg = await reaction.message.channel
                          .send("The Role is above my highest Role, I can't remove it from you!")
                          .catch(() => {});
                        if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                      }
                    } else {
                      console.log(`[DEBUG] Role ${param.Role} not found in guild`);
                      const msg = await reaction.message.channel
                        .send("This Role got deleted, I can't remove it from you!")
                        .catch(() => {});
                      if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                    }
                  } catch (error) {
                    console.error("[ERROR] Error removing role:", error);
                    const msg = await reaction.message.channel
                      .send({
                        content: `\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``,
                      })
                      .catch(() => {});
                    if (msg) setTimeout(() => msg.delete().catch(() => {}), 3000);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error(
            "[ERROR] In MessageReactionRemove:",
            e instanceof Error ? e.stack : String(e),
          );
        }
      },
    );
  },
);
