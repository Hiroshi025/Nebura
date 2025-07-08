// Project configuration root interface for the application.
// This interface represents the entire structure of the config.yml file.
export interface ProyectConfig {
  project: {
    name: string;
    version: string;
    type?: string;
    "api-version": string;
    logs: string;
    winstonlog: string;
    cdnpath: string;
  };
  environments: {
    default: {
      api: {
        port: number;
        host: string;
        swagger: {
          local: string;
          name: string;
          version: string;
          url: string;
          docs: string;
          auth: {
            name: string;
            password: string;
          };
        };
      };
      database: {
        sessions: {
          url: string;
          name: string;
        };
      };
      website: {
        role: string;
      };
    };
    production: {
      api: {
        port: number;
        host: string;
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
  modules: {
    discord: {
      id: string;
      callback: string;
      secret: string;
      channel: string;
      guildId: string;
      owners: string[];
      prefix: string;
      configs: {
        default: string;
        paths: {
          events: string;
          commands: string;
          components: string;
          addons: string;
          precommands: string
        }
        "bot-extensions": string[];
      };
    };
    whatsapp: {
      enabled: boolean;
    };
  };
  moderation: {
    notifications: {
      urlapi: string;
      version: string;
      webhooks: {
        token: string;
        id: string;
        avatarURL: string;
      };
    };
  };
  tasks: {
    reloadproyect: {
      enabled: boolean;
      cron: string;
      cmd: string;
      cmdreload: string;
    };
    backups: {
      enabled: boolean;
      path: string;
      cron: string;
    }
  };
}
