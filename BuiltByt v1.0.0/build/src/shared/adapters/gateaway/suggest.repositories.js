"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="256141c0-e51c-5174-91a9-6bd13f5465ff")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestRepository = void 0;
const main_1 = require("../../../main");
const error_extend_1 = require("../../../shared/adapters/extends/error.extend");
/**
 * Repository class for managing Suggestion entities in the database.
 * Provides methods to create, update, and retrieve suggestions, as well as manage upvotes, downvotes, and status changes.
 */
class SuggestRepository {
    constructor() { }
    /**
     * Creates a new suggestion in the database.
     * @param suggest Partial suggestion object containing required fields.
     * @throws {DiscordError} If required data is missing or invalid.
     * @returns The created suggestion object or false if creation failed.
     */
    async createSuggest(suggest) {
        if (!suggest ||
            !suggest.suggestId ||
            !suggest.messageId ||
            !suggest.content ||
            !suggest.authorId ||
            !suggest.guildId ||
            !suggest.status) {
            throw new error_extend_1.DiscordError("Invalid data provided for creating a suggestion.");
        }
        const data = await main_1.main.prisma.suggestion.create({
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
    async updateUpvote(data, messageId) {
        if (!data || !messageId) {
            throw new error_extend_1.DiscordError("Invalid data provided for updating upvotes.");
        }
        const updatedData = await main_1.main.prisma.suggestion.update({
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
    async getSuggestById(suggestId) {
        if (!suggestId) {
            throw new error_extend_1.DiscordError("Invalid suggest ID provided.");
        }
        const data = await main_1.main.prisma.suggestion.findUnique({
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
    async updateDownvote(data, messageId) {
        if (!data || !messageId) {
            throw new error_extend_1.DiscordError("Invalid data provided for updating downvotes.");
        }
        const dataSuggest = await main_1.main.prisma.suggestion.update({
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
    async updateStatus(suggestId, status, resolvedBy) {
        if (!suggestId || !status || !resolvedBy) {
            throw new error_extend_1.DiscordError("Invalid suggest ID or status provided.");
        }
        const data = await main_1.main.prisma.suggestion.update({
            where: { messageId: suggestId },
            data: { status: status, resolvedBy: resolvedBy, resolvedAt: new Date() },
        });
        return data ? data : false;
    }
}
exports.SuggestRepository = SuggestRepository;
//# sourceMappingURL=suggest.repositories.js.map
//# debugId=256141c0-e51c-5174-91a9-6bd13f5465ff
