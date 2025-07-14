import { Suggest } from "@typings/modules/discord";

/**
 * Interface for the Suggestion Repository Port.
 *
 * @remarks
 * This interface defines the contract for managing suggestion entities,
 * including creation, upvoting, downvoting, retrieval, and status updates.
 * Implementations should handle the persistence and retrieval logic for suggestions.
 *
 * @see {@link https://en.wikipedia.org/wiki/Suggestion Suggestion - Wikipedia}
 */
export interface ISuggestRepositoryPort {
  /**
   * Creates a new suggestion.
   *
   * @param suggest - Partial suggestion object containing the data to be saved.
   * @returns A promise that resolves to the created suggestion object, or `false` if creation fails.
   *
   * @example
   * ```ts
   * const result = await suggestRepository.createSuggest({ content: "New feature idea" });
   * ```
   */
  createSuggest(suggest: Partial<Suggest>): Promise<any | false>;

  /**
   * Updates the upvote count and voter information for a suggestion.
   *
   * @param data - Partial suggestion object containing upvote data (e.g., updated upvotes, voters).
   * @param messageId - The message ID associated with the suggestion.
   * @returns A promise that resolves to the updated suggestion object, or `false` if the update fails.
   *
   * @example
   * ```ts
   * const updated = await suggestRepository.updateUpvote({ upvotes: 5 }, "message123");
   * ```
   */
  updateUpvote(data: Partial<Suggest>, messageId: string): Promise<any | false>;

  /**
   * Retrieves a suggestion by its unique identifier.
   *
   * @param suggestId - The unique identifier of the suggestion.
   * @returns A promise that resolves to the suggestion object if found, or `false` if not found.
   *
   * @example
   * ```ts
   * const suggest = await suggestRepository.getSuggestById("suggestId123");
   * ```
   */
  getSuggestById(suggestId: string): Promise<any | false>;

  /**
   * Updates the downvote count and downvoter information for a suggestion.
   *
   * @param data - Partial suggestion object containing downvote data (e.g., updated downvotes, downvoters).
   * @param messageId - The message ID associated with the suggestion.
   * @returns A promise that resolves to the updated suggestion object, or `false` if the update fails.
   *
   * @example
   * ```ts
   * const updated = await suggestRepository.updateDownvote({ downvotes: 2 }, "message123");
   * ```
   */
  updateDownvote(data: Partial<Suggest>, messageId: string): Promise<any | false>;

  /**
   * Updates the status of a suggestion (e.g., resolved, rejected).
   *
   * @param suggestId - The unique identifier of the suggestion.
   * @param status - The new status to set for the suggestion.
   * @param resolvedBy - The identifier of the user who resolved the suggestion.
   * @returns A promise that resolves to the updated suggestion object, or `false` if the update fails.
   *
   * @example
   * ```ts
   * const updated = await suggestRepository.updateStatus("suggestId123", "resolved", "adminUserId");
   * ```
   */
  updateStatus(suggestId: string, status: string, resolvedBy: string): Promise<any | false>;
}
