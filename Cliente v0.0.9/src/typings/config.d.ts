// Project configuration root interface for the application.
// This interface represents the entire structure of the config.yml file.
export interface ProyectConfig {
  /**
   * General project information and paths.
   * @see {@link https://github.com/} for project conventions
   */
  project: {
    /** Project name */
    name: string;
    /** Project version */
    version: string;
    /** Project type, e.g., 'monorepo' (optional) */
    type?: string;
    /** API version used */
    "api-version": string;
    /** Path where application logs are stored */
    logs: string;
    /** Path for Winston logger logs */
    winstonlog: string;
    /** Path to CDN client backups */
    cdnpath: string;
  };
  /**
   * Environment-specific configuration blocks.
   * Includes default and production environments.
   */
  environments: {
    /** Default environment configuration */
    default: EnvironmentConfig;
    /** Production environment configuration */
    production: EnvironmentConfig;
  };
  /**
   * Modules configuration, such as Discord and WhatsApp.
   */
  modules: {
    /** Discord module configuration */
    discord: DiscordModuleConfig;
    /** WhatsApp module configuration */
    whatsapp: WhatsAppModuleConfig;
  };
  /** Moderation and notification configuration */
  moderation: ModerationConfig;
  /** Scheduled tasks configuration */
  tasks: TasksConfig;
}

/**
 * Environment configuration for API, database, and website.
 * Used for both default and production environments.
 */
export interface EnvironmentConfig {
  /** API server configuration */
  api: {
    /** Port where the API will run */
    port: number;
    /** Host address for the API */
    host: string;
    /** Swagger documentation configuration */
    swagger: {
      /** Path to Swagger config file */
      local: string;
      /** API name for Swagger documentation */
      name: string;
      /** API version for Swagger */
      version: string;
      /** Base URL for admin monitor */
      url: string;
      /** URL to access API documentation */
      docs: string;
      /** Swagger authentication credentials */
      auth: {
        /** Username for Swagger authentication */
        name: string;
        /** Password for Swagger authentication */
        password: string;
      };
    };
    /**
     * Session configuration for web sessions (optional).
     * Only present in production environment.
     */
    sessions?: {
      /** Secret key for web sessions */
      websecret?: string;
    };
  };
  /** Database configuration for sessions */
  database: {
    sessions: {
      /** Path to session database */
      url: string;
      /** Session database name */
      name: string;
    };
  };
  /** Website configuration, e.g., user role */
  website: {
    /** Website role, e.g., 'admin' */
    role: string;
  };
}

/**
 * Discord module configuration for bot integration.
 * @see {@link https://discord.com/developers/docs/intro} Discord API Docs
 */
export interface DiscordModuleConfig {
  /** Discord client ID */
  id: string;
  /** OAuth callback path */
  callback: string;
  /** Discord client secret */
  secret: string;
  /** Default channel ID for the bot */
  channel: string;
  /** Discord guild/server ID */
  guildId: string;
  /** List of bot owner user IDs */
  owners: string[];
  /** Prefix for bot commands */
  prefix: string;
  /**
   * Paths and extensions for Discord bot modules.
   */
  configs: {
    /** Default path for Discord module */
    default: string;
    /** Path to bot events */
    eventpath: string;
    /** Path to slash commands */
    commandpath: string;
    /** Path to bot components */
    componentspath: string;
    /** Path to bot addons */
    addonspath: string;
    /** Path to precommands */
    precommands: string;
    /** Supported file extensions for the bot */
    "bot-extensions": string[];
  };
}

/**
 * WhatsApp module configuration.
 */
export interface WhatsAppModuleConfig {
  /** Indicates if WhatsApp module is enabled */
  enabled: boolean;
}

/**
 * Moderation and notification configuration, e.g., for Discord webhooks.
 */
export interface ModerationConfig {
  notifications: {
    /** Base URL for Discord API */
    urlapi: string;
    /** Discord API version */
    version: string;
    /** Webhook configuration for notifications */
    webhooks: {
      /** Webhook token */
      token: string;
      /** Webhook ID */
      id: string;
      /** Webhook avatar URL (optional) */
      avatarURL: string;
    };
  };
}

/**
 * Scheduled tasks configuration, e.g., for project reloads.
 */
export interface TasksConfig {
  reloadproyect: {
    /** Indicates if project reload task is enabled */
    enabled: boolean;
    /** Cron schedule for reloading the project */
    cron: string;
    /** Command to execute for reload (optional) */
    cmd: string;
    /** Command to execute for reload (optional) */
    cmdreload?: string;
  };
}
