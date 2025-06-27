import { main } from "@/main";
import { Suggest } from "@typings/modules/discord";
import { DiscordError } from "@utils/extenders/error.extend";

/**
 * Repository class for managing Suggestion entities in the database.
 * Provides methods to create, update, and retrieve suggestions, as well as manage upvotes, downvotes, and status changes.
 */
export class SuggestRepository {
  constructor() {}

  /**
   * Creates a new suggestion in the database.
   * @param suggest Partial suggestion object containing required fields.
   * @throws {DiscordError} If required data is missing or invalid.
   * @returns The created suggestion object or false if creation failed.
   */
  public async createSuggest(suggest: Partial<Suggest>) {
    if (
      !suggest ||
      !suggest.suggestId ||
      !suggest.messageId ||
      !suggest.content ||
      !suggest.authorId ||
      !suggest.guildId ||
      !suggest.status
    ) {
      throw new DiscordError("Invalid data provided for creating a suggestion.");
    }

    const data = await main.prisma.suggestion.create({
      data: {
        suggestId: suggest.suggestId,
        messageId: suggest.messageId,
        content: suggest.content,
        imageUrl: suggest.imageUrl,
        authorId: suggest.authorId,
        guildId: suggest.guildId,
        status: suggest.status,
      },
    });

    return data ? data : false;
  }

  /**
   * Updates the upvote-related fields of a suggestion.
   * @param data Partial suggestion object containing upvote-related fields.
   * @param messageId The message ID of the suggestion to update.
   * @throws {DiscordError} If data or messageId is missing or invalid.
   * @returns The updated suggestion object or false if update failed.
   */
  public async updateUpvote(data: Partial<Suggest>, messageId: string) {
    if (!data || !messageId) {
      throw new DiscordError("Invalid data provided for updating upvotes.");
    }

    const updatedData = await main.prisma.suggestion.update({
      where: { messageId: messageId },
      data: {
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        voters: data.voters,
        downvoters: data.downvoters,
        lastVoter: data.lastVoter,
      },
    });

    return updatedData ? updatedData : false;
  }

  /**
   * Retrieves a suggestion by its unique suggest ID.
   * @param suggestId The unique suggest ID or message ID of the suggestion.
   * @throws {DiscordError} If suggestId is missing or invalid.
   * @returns The found suggestion object or false if not found.
   */
  public async getSuggestById(suggestId: string) {
    if (!suggestId) {
      throw new DiscordError("Invalid suggest ID provided.");
    }

    const data = await main.prisma.suggestion.findUnique({
      where: { messageId: suggestId },
    });

    return data ? data : false;
  }

  /**
   * Updates the downvote-related fields of a suggestion.
   * @param data Partial suggestion object containing downvote-related fields.
   * @param messageId The message ID of the suggestion to update.
   * @throws {DiscordError} If data or messageId is missing or invalid.
   * @returns The updated suggestion object or false if update failed.
   */
  public async updateDownvote(data: Partial<Suggest>, messageId: string) {
    if (!data || !messageId) {
      throw new DiscordError("Invalid data provided for updating downvotes.");
    }

    const dataSuggest = await main.prisma.suggestion.update({
      where: { messageId: messageId },
      data: {
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        voters: data.voters,
        downvoters: data.downvoters,
        lastVoter: data.lastVoter,
      },
    });

    return dataSuggest ? dataSuggest : false;
  }

  /**
   * Updates the status of a suggestion, marking it as resolved.
   * @param suggestId The unique suggest ID or message ID of the suggestion.
   * @param status The new status to set for the suggestion.
   * @param resolvedBy The ID of the user who resolved the suggestion.
   * @throws {DiscordError} If suggestId, status, or resolvedBy is missing or invalid.
   * @returns The updated suggestion object or false if update failed.
   */
  public async updateStatus(suggestId: string, status: string, resolvedBy: string) {
    if (!suggestId || !status || !resolvedBy) {
      throw new DiscordError("Invalid suggest ID or status provided.");
    }

    const data = await main.prisma.suggestion.update({
      where: { messageId: suggestId },
      data: { status: status, resolvedBy: resolvedBy, resolvedAt: new Date() },
    });

    return data ? data : false;
  }
}
