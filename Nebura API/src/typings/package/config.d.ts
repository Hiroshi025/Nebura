/**
 * Configuration for the project.
 */
export interface ProyectConfig {
  /**
   * General project information.
   */
  project: {
    /**
     * Name of the project.
     */
    name: string;
    /**
     * Version of the project.
     */
    version: string;
    /**
     * Type of the project (optional).
     */
    type?: string;
    /**
     * API version used by the project.
     */
    "api-version": string;
    /**
     * Log the proyect application
     */
    logs: string;
  };
  /**
   * Configuration for various modules.
   */
  modules: {
    /**
     * Configuration for the WhatsApp module.
     */
    whatsapp: {
      enabled: boolean;
    };
    /**
     * Configuration for the Discord module.
     */
    discord: {
      /**
       * Discord bot token.
       */
      token: string;
      /**
       * Discord client ID.
       */
      clientId: string;
      /**
       * Presence configuration for the Discord bot.
       */
      presence: {
        /**
         * Presence status (e.g., online, idle).
         */
        status: string;
        /**
         * Activity details for the bot's presence.
         */
        activity: {
          /**
           * Name of the activity.
           */
          name: string;
          /**
           * Type of activity (0-3).
           */
          type: number;
          /**
           * URL associated with the activity (optional).
           */
          url?: string;
        };
      };
      /**
       * Additional configuration for Discord commands and events.
       */
      configs: {
        /**
         * Path to the event handlers.
         */
        eventpath: string;
        /**
         * Path to the command handlers.
         */
        commandpath: string;
        /**
         * Path to the bot's modals, menus, buttons.
         */
        componentspath: string;
        /**
         * Path to the addons
         */
        addonspath: string;
        /**
         * List of bot extensions.
         */
        "bot-extensions": string[];
      };
    };
  };
  /**
   * Environment-specific configurations.
   */
  environments: {
    /**
     * Default environment configuration.
     */
    default: EnvironmentConfig;
    /**
     * Production environment configuration (inherits from 'default').
     */
    production?: Partial<EnvironmentConfig>;
  };
  /**
   * Moderation-related configurations.
   */
  moderation: {
    /**
     * Notification settings for moderation.
     */
    notifications: {
      /**
       * API URL for notifications.
       */
      urlapi: string;
      /**
       * API version for notifications.
       */
      version: string;
      /**
       * Webhook configuration for notifications.
       */
      webhooks: {
        /**
         * Webhook token.
         */
        token: string;
        /**
         * Webhook ID.
         */
        id: string;
        /**
         * Avatar URL for the webhook.
         */
        avatarURL: string;
      };
    };
  };
}

/**
 * Configuration for artificial services.
 */
export interface Artificial {
  /**
   * Services provided by the artificial system.
   */
  services: {
    /**
     * Configuration for the Gemini service.
     */
    gemini: {
      /**
       * Model used by Gemini.
       */
      model: string;
      /**
       * Configuration system for Gemini.
       */
      configsystem: string;
      /**
       * API key for accessing Gemini.
       */
      "api-key": string;
    };
  };
}

/**
 * Configuration for Swagger API documentation.
 */
export interface SwaggerConfig {
  /**
   * Local path to the Swagger file.
   */
  local: string;
  /**
   * Name of the API.
   */
  name: string;
  /**
   * Version of the API.
   */
  version: string;
  /**
   * URL of the API.
   */
  url: string;
  /**
   * Path to the API documentation.
   */
  docs: string;
  /**
   * Authentication details for accessing the API.
   */
  auth: {
    /**
     * Username for authentication.
     */
    name: string;
    /**
     * Password for authentication.
     */
    password: string;
  };
}

/**
 * Configuration for the API server.
 */
export interface ApiConfig {
  /**
   * Port number for the API server.
   */
  port: number;
  /**
   * Host address for the API server.
   */
  host: string;
  /**
   * Session-related configurations.
   */
  sessions: {
    /**
     * Secret key for web sessions.
     */
    websecret: string;
    /**
     * Secret key for JWT sessions.
     */
    jwtsecret: string;
  };
  /**
   * Swagger configuration for API documentation.
   */
  swagger: SwaggerConfig;
}

/**
 * Environment-specific configuration.
 */
export interface EnvironmentConfig {
  /**
   * API configuration for the environment.
   */
  api: ApiConfig;
  /**
   * Database-related configurations.
   */
  database: {
    /**
     * Configuration for session storage.
     */
    sessions: {
      /**
       * URL of the session database.
       */
      url: string;
      /**
       * Name of the session database.
       */
      name: string;
    };
  };
  /**
   * Artificial services configuration.
   */
  artificial: Artificial;
  /**
   * Secret keys for various roles.
   */
  "key-secrets": {
    /**
     * Administrator secret key.
     */
    administrator: string;
    /**
     * Customer secret key.
     */
    customer: string;
  };
}
