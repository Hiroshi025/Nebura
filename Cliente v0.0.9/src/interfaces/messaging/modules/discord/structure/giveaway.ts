import { GiveawaysManager } from "discord-giveaways";
import { ChannelType, NewsChannel, TextChannel, ThreadChannel, User } from "discord.js";

import { client, main } from "@/main";
import { Prisma } from "@prisma/client";
import { GiveawayInterface } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extenders/embeds.extend";

/**
 * Service class for managing Discord giveaways using the [discord-giveaways](https://github.com/Androz2091/discord-giveaways) library.
 * Handles loading, starting, rerolling, ending, and deleting giveaways, as well as custom requirements and event listeners.
 */
export class GiveawayService {
  private manager: GiveawaysManager;
  private readyPromise: Promise<void>; // <--- NUEVO

  /**
   * List of valid Discord channel types for hosting giveaways.
   * @private
   * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/ChannelType Discord.js ChannelType}
   */
  private static readonly VALID_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.PublicThread,
    ChannelType.PrivateThread,
    ChannelType.AnnouncementThread,
  ];

  /**
   * Constructs a new GiveawayService and initializes the GiveawaysManager.
   * Loads active giveaways from the database and sets up event listeners.
   */
  constructor() {
    this.manager = new GiveawaysManager(client, {
      default: {
        botsCanWin: false,
        exemptPermissions: ["Administrator"],
        embedColor: "#FFA500",
        embedColorEnd: "#008000",
        reaction: "🎉",
        lastChance: {
          enabled: true,
          content: "⚠️ **LAST CHANCE TO ENTER!** ⚠️",
          threshold: 5000,
          embedColor: "#FF0000",
        },
      },
    });

    // Cambia esto:
    // this.loadGiveaways()
    //   .then(() => console.log("[GiveawayService] Giveaways loaded successfully"))
    //   .catch((err) => console.error("[GiveawayService] Error loading giveaways:", err));

    // Por esto:
    this.readyPromise = this.loadGiveaways()
      .then(() => console.log("[GiveawayService] Giveaways loaded successfully"))
      .catch((err) => console.error("[GiveawayService] Error loading giveaways:", err));

    this.setupListeners();
  }

  // NUEVO MÉTODO
  public async waitUntilReady(): Promise<void> {
    await this.readyPromise;
  }

  /**
   * Loads all active giveaways from the database and restarts them in the manager.
   * Skips giveaways that are already running or whose channels are invalid.
   *
   * @private
   * @returns Promise that resolves when all giveaways are loaded.
   */
  private async loadGiveaways(): Promise<void> {
    try {
      const giveaways = await main.prisma.giveaway.findMany({
        where: { endsAt: { gt: new Date() } },
        include: { requirements: true },
      });

      const loadPromises = giveaways.map(async (giveaway) => {
        if (this.manager.giveaways.some((g) => g.messageId === giveaway.messageId)) {
          return; // Skip already running giveaways
        }

        const channel = await this.getValidChannel(giveaway.channelId);
        if (!channel) {
          console.warn(
            `[GiveawayService] Channel ${giveaway.channelId} not found or invalid for giveaway ${giveaway.messageId}`,
          );
          return;
        }

        // Fix: Ensure createdTimestamp is not null for ThreadChannels
        if ("createdTimestamp" in channel && channel.createdTimestamp === null) {
          console.warn(
            `[GiveawayService] Channel ${giveaway.channelId} has null createdTimestamp and cannot be used for giveaway ${giveaway.messageId}`,
          );
          return;
        }

        const options: GiveawayInterface.Options = {
          duration: giveaway.endsAt.getTime() - Date.now(),
          prize: giveaway.prize,
          winnerCount: giveaway.winnerCount,
          hostedBy: client.users.cache.get(giveaway.hostedBy) as User,
          messages: {
            giveaway: "🎉 **GIVEAWAY** 🎉",
            giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
            inviteToParticipate: "Click the 🎉 reaction to enter!",
            timeRemaining: "Time remaining: **{duration}**",
            winMessage: "Congratulations, {winners}! You won **{prize}**!",
            noWinner: "Giveaway cancelled, no valid participations.",
            hostedBy: "Hosted by: {user}",
            winners: "winner(s)",
            endedAt: "Ended at",
          },
        };

        if (giveaway.requirements) {
          options.requirements = {
            requiredRoles: giveaway.requirements.requiredRoles,
            minAccountAge: giveaway.requirements.minAccountAge ?? undefined,
            minMessages: giveaway.requirements.minMessages ?? undefined,
          };
        }

        try {
          await this.manager.start(channel as any, options);
          console.log(`[GiveawayService] Successfully reloaded giveaway ${giveaway.messageId}`);
        } catch (error) {
          console.error(`[GiveawayService] Failed to reload giveaway ${giveaway.messageId}:`, error);
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      console.error("[GiveawayService] Error loading giveaways from database:", error);
      throw error;
    }
  }

  /**
   * Fetches and validates a Discord channel for hosting a giveaway.
   * Checks channel type and required bot permissions.
   *
   * @private
   * @param channelId - The ID of the channel to fetch.
   * @returns The valid channel or null if invalid.
   */
  private async getValidChannel(channelId: string): Promise<TextChannel | NewsChannel | ThreadChannel | null> {
    try {
      const channel = await client.channels.fetch(channelId);

      if (!channel || !GiveawayService.VALID_CHANNEL_TYPES.includes(channel.type)) {
        return null;
      }

      // Check bot permissions
      // Only GuildChannels have permissionsFor
      if ("permissionsFor" in channel && typeof channel.permissionsFor === "function") {
        const permissions = channel.permissionsFor(client.user!.id);
        if (!permissions?.has(["ViewChannel", "SendMessages", "EmbedLinks", "AddReactions"])) {
          console.warn(`[GiveawayService] Missing permissions in channel ${channel.id}`);
          return null;
        }
      } else {
        console.warn(`[GiveawayService] Channel ${channel.id} does not support permissionsFor`);
        return null;
      }

      return channel as TextChannel | NewsChannel | ThreadChannel;
    } catch (error) {
      console.error(`[GiveawayService] Error fetching channel ${channelId}:`, error);
      return null;
    }
  }

  /**
   * Sets up event listeners for the GiveawaysManager.
   * Handles giveaway ended, rerolled, and no participants scenarios.
   *
   * @private
   */
  private setupListeners(): void {
    // Giveaway ended
    this.manager.on("giveawayEnded", async (giveaway, winners) => {
      try {
        // 1. First find the giveaway data with requirements
        const giveawayData = await main.prisma.giveaway.findUnique({
          where: { messageId: giveaway.messageId },
          include: { requirements: true },
        });

        if (!giveawayData) {
          console.warn(`[GiveawayService] Giveaway ${giveaway.messageId} not found in database`);
          return;
        }

        // 2. Prepare transaction for atomic deletion
        const deleteOperations = [];

        // Delete requirements if they exist
        if (giveawayData.requirements) {
          deleteOperations.push(
            main.prisma.giveawayRequirements.delete({
              where: { giveawayId: giveawayData.id },
            }),
          );
        }

        // Delete the main giveaway entry
        deleteOperations.push(
          main.prisma.giveaway.delete({
            where: { messageId: giveaway.messageId },
          }),
        );

        // 3. Execute transaction
        await main.prisma.$transaction(deleteOperations);

        // 4. Log successful deletion
        console.log(
          `[GiveawayService] Successfully deleted giveaway ${giveaway.messageId} and its requirements from DB`,
        );

        // 5. Optional: Send winner announcement if winners exist
        if (winners && winners.length > 0) {
          const channel = await this.getValidChannel(giveaway.channelId);
          if (channel) {
            await channel.send({
              embeds: [
                new EmbedCorrect()
                  .setTitle("🎉 Giveaway Ended 🎉")
                  .setDescription(
                    `Congratulations to the winner(s) of **${giveaway.prize}**!\n` +
                      `**Winner(s):** ${winners.map((w) => w.toString()).join(", ")}\n\n` +
                      `Thank you to everyone who participated!`,
                  )
                  .setFooter({ text: `Giveaway ID: ${giveaway.messageId}` }),
              ],
            });
          }
        }
      } catch (error) {
        console.error(`[GiveawayService] Error processing ended giveaway ${giveaway.messageId}:`, error);

        // Additional error handling for specific cases
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            console.warn(`[GiveawayService] Record not found for giveaway ${giveaway.messageId}`);
          } else {
            console.error(`[GiveawayService] Database error for giveaway ${giveaway.messageId}:`, error.meta);
          }
        }

        // Optionally attempt to clean up again or notify admins
        try {
          await main.prisma.giveaway.deleteMany({
            where: { messageId: giveaway.messageId },
          });
          console.warn(`[GiveawayService] Performed cleanup deletion for giveaway ${giveaway.messageId}`);
        } catch (cleanupError) {
          console.error(`[GiveawayService] Cleanup failed for giveaway ${giveaway.messageId}:`, cleanupError);
        }
      }
    });

    // Giveaway rerolled
    this.manager.on("giveawayRerolled", async (giveaway, winners) => {
      try {
        const channel = await this.getValidChannel(giveaway.channelId);
        if (channel) {
          await channel.send({
            embeds: [
              new EmbedCorrect()
                .setTitle("🎉 Giveaway Rerolled")
                .setDescription(
                  `The giveaway for **${giveaway.prize}** has been rerolled!\n` +
                    `New winner(s): ${winners.map((w) => w.toString()).join(", ")}`,
                ),
            ],
          });
        }
      } catch (error) {
        console.error(`[GiveawayService] Error handling reroll for giveaway ${giveaway.messageId}:`, error);
      }
    });

    this.manager.on("giveawayReactionAdded", async (giveaway, member) => {
      try {
        const channel = await this.getValidChannel(giveaway.channelId);
        if (!channel) return;

        // Check if user meets requirements
        // Retrieve requirements from the database or cache if needed
        const dbGiveaway = await main.prisma.giveaway.findUnique({
          where: { messageId: giveaway.messageId },
          include: { requirements: true },
        });

        const requirements = dbGiveaway?.requirements as GiveawayInterface.Requirements | undefined;
        if (requirements) {
          const guildMember = await member.guild.members.fetch(member.id);

          // Check required roles
          if (requirements.requiredRoles?.length) {
            const hasRequiredRoles = requirements.requiredRoles.some((roleId) => guildMember.roles.cache.has(roleId));

            if (!hasRequiredRoles) {
              await member.send({
                embeds: [
                  new ErrorEmbed()
                    .setTitle("Entry Requirements Not Met")
                    .setDescription(
                      `You don't have the required roles to enter the giveaway for **${giveaway.prize}**`,
                    ),
                ],
              });
              try {
                const channel = await this.getValidChannel(giveaway.channelId);
                if (!channel) return;

                const message = await channel.messages.fetch(giveaway.messageId);
                // Busca la reacción 🎉 (o la que uses en tu configuración)
                const reaction = message.reactions.cache.find(
                  (r) => r.emoji.name === (giveaway.options?.reaction || "🎉"),
                );
                if (reaction) {
                  await reaction.users.remove(member.id);
                }
              } catch (err) {
                console.error(`[GiveawayService] Error removing reaction for user ${member.id}:`, err);
              }
              return;
            }
          }

          // Check minimum account age
          if (requirements.minAccountAge) {
            const accountAgeDays = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
            if (accountAgeDays < requirements.minAccountAge) {
              await member.send({
                embeds: [
                  new ErrorEmbed()
                    .setTitle("Entry Requirements Not Met")
                    .setDescription(
                      `Your account must be at least ${requirements.minAccountAge} days old to enter this giveaway`,
                    ),
                ],
              });
              try {
                const channel = await this.getValidChannel(giveaway.channelId);
                if (!channel) return;

                const message = await channel.messages.fetch(giveaway.messageId);
                // Busca la reacción 🎉 (o la que uses en tu configuración)
                const reaction = message.reactions.cache.find(
                  (r) => r.emoji.name === (giveaway.options?.reaction || "🎉"),
                );
                if (reaction) {
                  await reaction.users.remove(member.id);
                }
              } catch (err) {
                console.error(`[GiveawayService] Error removing reaction for user ${member.id}:`, err);
              }
              return;
            }
          }

          // Check minimum messages (if implemented in your bot)
          if (requirements.minMessages) {
            const userMessages = 0; // Replace with your implementation
            if (userMessages < requirements.minMessages) {
              await member.send({
                embeds: [
                  new ErrorEmbed()
                    .setTitle("Entry Requirements Not Met")
                    .setDescription(
                      `You need at least ${requirements.minMessages} messages in this server to enter this giveaway`,
                    ),
                ],
              });

              //await giveaway.removeEntrant(member.id);
              //removeEntrant no existe dentro de discord-giveaway por lo que crea tu mismo la logica para remover la reaccion del usuario
              try {
                const channel = await this.getValidChannel(giveaway.channelId);
                if (!channel) return;

                const message = await channel.messages.fetch(giveaway.messageId);
                // Busca la reacción 🎉 (o la que uses en tu configuración)
                const reaction = message.reactions.cache.find(
                  (r) => r.emoji.name === (giveaway.options?.reaction || "🎉"),
                );
                if (reaction) {
                  await reaction.users.remove(member.id);
                }
              } catch (err) {
                console.error(`[GiveawayService] Error removing reaction for user ${member.id}:`, err);
              }
              return;
            }
          }
        }

        console.log(`[GiveawayService] User ${member.user.tag} (${member.id}) entered giveaway ${giveaway.messageId}`);
      } catch (error) {
        console.error(`[GiveawayService] Error handling giveaway reaction added for ${giveaway.messageId}:`, error);
      }
    });

    this.manager.on("endedGiveawayReactionAdded", async (giveaway, member) => {
      try {
        await member.send({
          embeds: [
            new ErrorEmbed()
              .setTitle("Giveaway Already Ended")
              .setDescription(
                `The giveaway for **${giveaway.prize}** has already ended. ` +
                  "Please check for new giveaways in the server!",
              ),
          ],
        });
        console.log(`[GiveawayService] User ${member.user.tag} tried to enter ended giveaway ${giveaway.messageId}`);
      } catch (error) {
        console.error(`[GiveawayService] Error handling ended giveaway reaction for ${giveaway.messageId}:`, error);
      }
    });

    this.manager.on("giveawayReactionRemoved", async (giveaway, member) => {
      try {
        console.log(`[GiveawayService] User ${member.user.tag} (${member.id}) left giveaway ${giveaway.messageId}`);

        // Optional: Send confirmation DM
        await member.send({
          embeds: [
            new EmbedCorrect()
              .setTitle("Giveaway Entry Removed")
              .setDescription(
                `You've been removed from the giveaway for **${giveaway.prize}**. ` +
                  "You can re-enter by reacting again before the giveaway ends.",
              ),
          ],
        });
      } catch (error) {
        console.error(`[GiveawayService] Error handling giveaway reaction removed for ${giveaway.messageId}:`, error);
      }
    });

    this.manager.on("giveawayDeleted", async (giveaway) => {
      try {
        // Delete from database
        await main.prisma.giveaway.delete({
          where: { messageId: giveaway.messageId },
        });

        console.log(`[GiveawayService] Giveaway ${giveaway.messageId} was deleted and removed from DB`);

        // Optional: Notify in the original channel if possible
        const channel = await this.getValidChannel(giveaway.channelId);
        if (channel) {
          await channel.send({
            embeds: [
              new ErrorEmbed()
                .setTitle("Giveaway Cancelled")
                .setDescription(
                  `The giveaway for **${giveaway.prize}** has been cancelled. ` + "All entries have been voided.",
                ),
            ],
          });
        }
      } catch (error) {
        console.error(`[GiveawayService] Error handling deleted giveaway ${giveaway.messageId}:`, error);
      }
    });
  }

  /**
   * Starts a new giveaway in the specified channel with extended options.
   * Saves the giveaway to the database.
   *
   * @param channel - The Discord channel to host the giveaway in.
   * @param options - The options for the giveaway, including requirements.
   * @returns The created giveaway object.
   * @throws Error if the bot lacks permissions or the giveaway cannot be started.
   */
  public async startGiveaway(
    channel: TextChannel | NewsChannel | ThreadChannel,
    options: GiveawayInterface.Options,
  ): Promise<any> {
    try {
      // Validate channel permissions
      const permissions = channel.permissionsFor(client.user!.id);
      if (!permissions?.has(["ViewChannel", "SendMessages", "EmbedLinks", "AddReactions"])) {
        throw new Error("Bot lacks necessary permissions in the target channel");
      }

      // Start the giveaway
      const giveaway = await this.manager.start(channel as any, options);

      // Prepare database data
      const dbData = {
        messageId: giveaway.messageId,
        channelId: giveaway.channelId,
        guildId: giveaway.guildId,
        prize: giveaway.prize,
        winnerCount: giveaway.winnerCount,
        endsAt: new Date(giveaway.endAt),
        hostedBy: options.hostedBy?.id || client.user!.id,
        ...(options.requirements && {
          requirements: {
            create: {
              ...(options.requirements.requiredRoles && {
                requiredRoles: options.requirements.requiredRoles,
              }),
              ...(options.requirements.minAccountAge && {
                minAccountAge: options.requirements.minAccountAge,
              }),
              ...(options.requirements.minMessages && {
                minMessages: options.requirements.minMessages,
              }),
            },
          },
        }),
      };

      // Save to database
      await main.prisma.giveaway.create({ data: dbData });

      return giveaway;
    } catch (error) {
      console.error("[GiveawayService] Error starting giveaway:", error);
      throw error;
    }
  }

  /**
   * Gets the GiveawaysManager instance.
   *
   * @returns The GiveawaysManager used by this service.
   */
  public getManager(): GiveawaysManager {
    return this.manager;
  }

  /**
   * Rerolls a giveaway to select new winners.
   *
   * @param messageId - The message ID of the giveaway to reroll.
   * @param options - Optional reroll options (e.g., new winner count).
   * @throws Error if the reroll fails.
   */
  public async rerollGiveaway(messageId: string, options?: { winnerCount?: number }): Promise<void> {
    try {
      await this.manager.reroll(messageId, options);
    } catch (error) {
      console.error(`[GiveawayService] Error rerolling giveaway ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Ends a giveaway early.
   *
   * @param messageId - The message ID of the giveaway to end.
   * @throws Error if the giveaway cannot be ended.
   */
  public async endGiveaway(messageId: string): Promise<void> {
    try {
      await this.manager.end(messageId);
    } catch (error) {
      console.error(`[GiveawayService] Error ending giveaway ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a giveaway from both the manager and the database.
   *
   * @param messageId - The message ID of the giveaway to delete.
   * @throws Error if the giveaway cannot be deleted.
   */
  public async deleteGiveaway(messageId: string): Promise<void> {
    try {
      // Delete from manager
      await this.manager.delete(messageId);

      // Delete from database
      await main.prisma.giveaway.delete({
        where: { messageId },
      });
    } catch (error) {
      console.error(`[GiveawayService] Error deleting giveaway ${messageId}:`, error);
      throw error;
    }
  }
}
