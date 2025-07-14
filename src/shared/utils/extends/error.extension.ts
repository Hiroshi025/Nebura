/**
 * Represents a domain-specific error in the application.
 *
 * @example
 * throw new DomainError("Invalid domain operation");
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Represents an error related to project-specific logic or configuration.
 *
 * @example
 * throw new ProyectError("Project configuration missing");
 */
export class ProyectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProyectError";
  }
}

/**
 * Represents an error thrown by Prisma ORM operations.
 *
 * @example
 * throw new PrismaError("Database connection failed");
 *
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export class PrismaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrismaError";
  }
}

/**
 * Represents an error related to Discord integration or API calls.
 *
 * @example
 * throw new DiscordError("Failed to send message to Discord");
 *
 * @see https://discord.js.org/#/docs/main/stable/class/DiscordAPIError
 */
export class DiscordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscordError";
  }
}

/**
 * Represents an error in repository or data access layer operations.
 *
 * @example
 * throw new RepositoryError("Repository not found");
 */
export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

/**
 * Represents an error related to Telegram integration or API calls.
 *
 * @example
 * throw new TelegramError("Telegram bot token invalid");
 *
 * @see https://core.telegram.org/bots/api#making-requests
 */
export class TelegramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramError";
  }
}
