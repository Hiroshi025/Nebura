/**
 * Project configuration root interface for the application.
 *
 * This interface represents the entire structure of the `config.yml` file used to configure the application.
 * It includes project metadata, environment-specific settings, module configurations, moderation notifications,
 * and scheduled tasks.
 *
 * @remarks
 * - The structure is designed to be compatible with YAML or JSON configuration files.
 * - Environment-specific overrides are supported for production.
 *
 * @see {@link https://yaml.org/spec/1.2/spec.html YAML Specification}
 */
export interface ProyectConfig {
  /**
   * Project metadata and global settings.
   */
  project: {
    /** The name of the project. */
    name: string;
    /** The version of the project. */
    version: string;
    /** The type of the project (optional). */
    type?: string;
    /** The API version used by the project. */
    "api-version": string;
    /** The path or identifier for log files. */
    logs: string;
    /** The Winston logger configuration file or identifier. */
    winstonlog: string;
    /** The CDN path for static assets. */
    cdnpath: string;
  };
  /**
   * Environment-specific configuration.
   *
   * @remarks
   * - The `default` environment is used for development or fallback.
   * - The `production` environment can override any default values.
   */
  environments: {
    /**
     * Default environment settings.
     */
    default: {
      api: {
        /** The port number for the API server. */
        port: number;
        /** The host address for the API server. */
        host: string;
        /** Swagger documentation configuration. */
        swagger: {
          /** Local path to Swagger UI. */
          local: string;
          /** Name of the API for Swagger. */
          name: string;
          /** Version of the API for Swagger. */
          version: string;
          /** URL to the Swagger documentation. */
          url: string;
          /** Path to the Swagger docs. */
          docs: string;
          /** Authentication credentials for Swagger UI. */
          auth: {
            /** Username for Swagger UI. */
            name: string;
            /** Password for Swagger UI. */
            password: string;
          };
        };
      };
      database: {
        sessions: {
          /** Database connection URL for sessions. */
          url: string;
          /** Database name for sessions. */
          name: string;
        };
      };
      website: {
        /** Default role for the website. */
        role: string;
      };
    };
    /**
     * Production environment overrides.
     */
    production: {
      api: {
        /** The port number for the API server. */
        port: number;
        /** The host address for the API server. */
        host: string;
        /** Swagger documentation configuration (optional). */
        swagger?: {
          local?: string;
          name?: string;
          version?: string;
          url?: string;
          docs?: string;
          auth?: {
            name?: string;
            password?: string;
          };
        };
      };
      database?: {
        sessions?: {
          url?: string;
          name?: string;
        };
      };
      website?: {
        role?: string;
      };
    };
  };
  /**
   * Module-specific configuration for integrations such as Discord and WhatsApp.
   */
  modules: {
    /**
     * Discord bot configuration.
     */
    discord: {
      /** Discord application/client ID. */
      id: string;
      /** Discord bot token. */
      token: string;
      /** OAuth2 callback URL. */
      callback: string;
      /** Discord client secret. */
      secret: string;
      /** Default channel ID for the bot. */
      channel: string;
      /** Guild (server) ID where the bot operates. */
      guildId: string;
      /** Array of user IDs who are bot owners. */
      owners: string[];
      /** Command prefix for the bot. */
      prefix: string;
      /** Additional Discord bot configuration. */
      configs: {
        /** Default configuration file or identifier. */
        default: string;
        /** Paths to various Discord bot components. */
        paths: {
          /** Path to event handlers. */
          events: string;
          /** Path to command handlers. */
          commands: string;
          /** Path to component handlers. */
          components: string;
          /** Path to addon modules. */
          addons: string;
          /** Path to precommand handlers. */
          precommands: string;
        };
        /** List of enabled bot extensions. */
        "bot-extensions": string[];
      };
    };
    /**
     * WhatsApp integration configuration.
     */
    whatsapp: {
      /** Whether WhatsApp integration is enabled. */
      enabled: boolean;
      backups: string;
    };
  };
  /**
   * Moderation and notification settings.
   */
  moderation: {
    notifications: {
      /** API URL for notifications. */
      urlapi: string;
      /** API version for notifications. */
      version: string;
      /** Webhook configuration for notifications. */
      webhooks: {
        /** Webhook token. */
        token: string;
        /** Webhook ID. */
        id: string;
        /** Avatar URL for webhook messages. */
        avatarURL: string;
      };
    };
  };
  /**
   * Scheduled tasks and automation settings.
   */
  tasks: {
    /**
     * Project reload task configuration.
     */
    reloadproyect: {
      /** Whether the reload task is enabled. */
      enabled: boolean;
      /** Cron expression for scheduling the reload. */
      cron: string;
      /** Command to execute for reload. */
      cmd: string;
      /** Command to execute for reload with reload flag. */
      cmdreload: string;
    };
    /**
     * Backup task configuration.
     */
    backups: {
      /** Whether backups are enabled. */
      enabled: boolean;
      /** Path where backups are stored. */
      path: string;
      /** Cron expression for scheduling backups. */
      cron: string;
    };
  };
}
