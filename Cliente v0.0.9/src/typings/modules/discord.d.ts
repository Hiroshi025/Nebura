import { GiveawayStartOptions } from "discord-giveaways";
import {
	AutocompleteInteraction, ButtonInteraction, ChannelSelectMenuInteraction, Message,
	ModalSubmitInteraction, PermissionResolvable, RoleSelectMenuInteraction,
	StringSelectMenuInteraction
} from "discord.js";

import { MyDiscord } from "@/interfaces/messaging/modules/discord/client";

//----------------- DISCORD INTERFACES --------------------//

/**
 * Represents a field object for Discord embeds.
 * @property name - The name of the field.
 * @property value - The value of the field.
 * @property inline - Whether the field is displayed inline.
 */
export interface Fields {
  /** The name of the field. */
  name: string;
  /** The value of the field. */
  value: string;
  /** Whether the field is displayed inline. */
  inline: boolean;
}

/**
 * Options for configuring a Discord command.
 *
 * @remarks
 * This interface is used to define the configuration for a Discord command, including cooldowns, owner restrictions, and autocomplete handling.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/AutocompleteInteraction Discord.js AutocompleteInteraction}
 *
 * @example
 * ```ts
 * const myCommand: CommandOptions = {
 *   cooldown: 10,
 *   owner: true,
 *   autocomplete: (client, interaction, config) => {
 *     // handle autocomplete
 *   }
 * };
 * ```
 */
export interface CommandOptions {
  /**
   * Cooldown time in seconds for the command.
   * This defines the minimum time a user must wait before reusing the command.
   */
  cooldown?: number;
  /**
   * Indicates if the command is restricted to the bot owner.
   * If set to `true`, only the bot owner can execute this command.
   */
  owner?: boolean;
  /**
   * Function to handle autocomplete interactions for the command.
   *
   * @param client - The main Discord client instance.
   * @param interaction - The autocomplete interaction object provided by Discord.js.
   * @param configuration - The bot's configuration object, containing global settings.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/AutocompleteInteraction Discord.js AutocompleteInteraction}
   */
  autocomplete?: (client: MyDiscord, interaction: AutocompleteInteraction, configuration: typeof config) => void;
}

/**
 * Types of files that can be used in the bot.
 *
 * @remarks
 * These represent the different component types supported by the bot.
 *
 * @example
 * const type: FileType = "buttons";
 */
export type FileType = "buttons" | "modals" | "menus";

/**
 * Base interface for component data.
 *
 * @remarks
 * This interface defines the common properties shared by all bot components, such as permissions and cooldowns.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable Discord.js PermissionResolvable}
 */
export interface componentData {
  /**
   * Unique identifier for the component.
   * This ID is used to distinguish the component from others.
   */
  id: string;
  /**
   * Indicates if the component is related to tickets.
   * If `true`, the component is associated with ticketing functionality.
   */
  tickets: boolean;
  /**
   * Indicates if the component is restricted to the bot owner.
   * If `true`, only the bot owner can interact with this component.
   */
  owner: boolean;
  /**
   * Cooldown time in seconds for the precommand.
   * This defines the minimum time a user must wait before reusing the command.
   */
  cooldown?: number;
  /**
   * Indicates if the component is under maintenance.
   * If `true`, the component is temporarily disabled for updates or fixes.
   */
  maintenance?: boolean;
  /**
   * Permissions required by the user to interact with the component.
   * This is an array of Discord permissions that the user must have.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable Discord.js PermissionResolvable}
   */
  permissions: PermissionResolvable[];
  /**
   * Permissions required by the bot to execute the component.
   * This is an array of Discord permissions that the bot must have.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable Discord.js PermissionResolvable}
   */
  botpermissions: PermissionResolvable[];
}

/**
 * Interface for button components.
 *
 * @remarks
 * This interface extends {@link componentData} and adds functionality specific to buttons.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ButtonInteraction Discord.js ButtonInteraction}
 */
export interface Buttons extends componentData {
  /**
   * Function to execute when the button is interacted with.
   *
   * @param interaction - The button interaction object provided by Discord.js.
   * @param client - The bot client instance, which manages the bot's state and interactions.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ButtonInteraction Discord.js ButtonInteraction}
   */
  execute: (interaction: ButtonInteraction, client: MyDiscord, language: string, configuration: typeof config) => void;
}

/**
 * Interface for menu components.
 *
 * @remarks
 * This interface extends {@link componentData} and adds functionality specific to menus.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/StringSelectMenuInteraction Discord.js StringSelectMenuInteraction}
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ChannelSelectMenuInteraction Discord.js ChannelSelectMenuInteraction}
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/RoleSelectMenuInteraction Discord.js RoleSelectMenuInteraction}
 */
export interface Menus extends componentData {
  /**
   * Function to execute when the menu is interacted with.
   *
   * @param interaction - The menu interaction object, which can be one of several types:
   * `StringSelectMenuInteraction`, `ChannelSelectMenuInteraction`, or `RoleSelectMenuInteraction`.
   * @param client - The bot client instance, which manages the bot's state and interactions.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/StringSelectMenuInteraction Discord.js StringSelectMenuInteraction}
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ChannelSelectMenuInteraction Discord.js ChannelSelectMenuInteraction}
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/RoleSelectMenuInteraction Discord.js RoleSelectMenuInteraction}
   */
  execute: (
    interaction: StringSelectMenuInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
    client: MyDiscord,
    language: string,
    configuration: typeof config,
  ) => void;
}

/**
 * Interface for modal components.
 *
 * @remarks
 * This interface extends {@link componentData} and adds functionality specific to modals.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ModalSubmitInteraction Discord.js ModalSubmitInteraction}
 */
export interface Modals extends componentData {
  /**
   * Function to execute when the modal is submitted.
   *
   * @param interaction - The modal submit interaction object provided by Discord.js.
   * @param client - The bot client instance, which manages the bot's state and interactions.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ModalSubmitInteraction Discord.js ModalSubmitInteraction}
   */
  execute: (
    interaction: ModalSubmitInteraction,
    client: MyDiscord,
    language: string,
    configuration: typeof config,
  ) => void;
}

/**
 * Configuration for an addon module.
 *
 * @remarks
 * This interface defines the metadata and permissions required for an addon.
 *
 * @example
 * ```ts
 * const addon: AddonConfig = {
 *   name: "MyAddon",
 *   description: "Adds new features",
 *   author: "AuthorName",
 *   version: "1.0.0",
 *   bitfield: ["MANAGE_GUILD"]
 * };
 * ```
 */
export interface AddonConfig {
  /**
   * Name of the addon.
   * This is a human-readable identifier for the addon.
   */
  name: string;
  /**
   * Description of the addon.
   * This provides a brief summary of the addon's functionality.
   */
  description: string;
  /**
   * Author of the addon.
   * This specifies the creator or maintainer of the addon.
   */
  author: string;
  /**
   * Version of the addon.
   * This follows semantic versioning (e.g., `1.0.0`).
   * @see {@link https://semver.org/ Semantic Versioning}
   */
  version: string;
  /**
   * Permissions required by the addon.
   * This is an array of Discord permissions that the addon needs to function.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable Discord.js PermissionResolvable}
   */
  bitfield: PermissionResolvable[];
}

/**
 * Interface for precommands.
 *
 * @remarks
 * Precommands are commands that can be executed via text messages in Discord.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/Message Discord.js Message}
 *
 * @example
 * ```ts
 * const pingCommand: Precommand = {
 *   name: "ping",
 *   description: "Replies with pong!",
 *   permissions: [],
 *   botpermissions: [],
 *   execute: (client, message, args, prefix, language, config) => {
 *     message.reply("pong!");
 *   }
 * };
 * ```
 */
export interface Precommand {
  /**
   * Name of the precommand.
   * This is the primary identifier used to invoke the command.
   */
  name: string;
  /**
   * Aliases for the precommand.
   * These are alternative names that can also invoke the command.
   */
  aliases?: string[];
  /**
   * Description of the precommand.
   * This provides a brief summary of the command's functionality.
   */
  description: string;
  /**
   * Permissions required by the user to execute the precommand.
   * This is an array of Discord permissions that the user must have.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable Discord.js PermissionResolvable}
   */
  permissions: PermissionResolvable[];
  /**
   * Permissions required by the bot to execute the precommand.
   * This is an array of Discord permissions that the bot must have.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable Discord.js PermissionResolvable}
   */
  botpermissions: PermissionResolvable[];
  /**
   * Indicates if the precommand is restricted to the bot owner.
   * If `true`, only the bot owner can execute this command.
   */
  owner?: boolean;
  /**
   * Indicates if the precommand is marked as NSFW (Not Safe For Work).
   * If `true`, the command can only be used in NSFW channels.
   */
  nsfw?: boolean;
  /**
   * Cooldown time in seconds for the precommand.
   * This defines the minimum time a user must wait before reusing the command.
   */
  cooldown?: number;
  /**
   * Subcommands associated with the precommand.
   * These are additional commands that extend the functionality of the main command.
   */
  subcommands?: string[];
  /**
   * Usage information for the precommand.
   * This provides guidance on how to use the command.
   */
  usage?: string;
  /**
   * Examples of how to use the precommand.
   * These are sample invocations that demonstrate the command's usage.
   */
  examples?: string[];
  /**
   * Indicates if the precommand is under maintenance.
   * If `true`, the command is temporarily disabled for updates or fixes.
   */
  maintenance?: boolean;

  /**
   * Category of the precommand.
   * This is used to group commands into logical categories for better organization.
   */
  category?: string;
  nameLocalizations?: Record<string, string>;
  descriptionLocalizations?: Record<string, string>;
  /**
   * Function to execute the precommand.
   *
   * @param client - The main Discord client instance.
   * @param message - The message object that triggered the command.
   * @param args - The arguments provided with the command.
   * @param prefix - The prefix used to invoke the command.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   * @see {@link https://discord.js.org/#/docs/discord.js/main/class/Message Discord.js Message}
   */
  execute: (
    client: MyDiscord,
    message: Message,
    args: string[],
    prefix: string,
    language: string,
    configuration: typeof config,
  ) => void;
}

//----------------- NPM PACKAGE INTERFACE --------------------//

/**
 * Represents the structure of an NPM package.
 */
export interface NPMPackage {
  /** The name of the package. */
  name: string;
  /** The version of the package. */
  version: string;
  /** The description of the package. */
  description: string;
  /** The author of the package. */
  author?:
    | {
        /** Name of the author. */
        name: string;
        /** Email of the author. */
        email?: string;
        /** URL of the author. */
        url?: string;
      }
    | string;
  /** The license of the package. */
  license?: string;
  /** The homepage URL of the package. */
  homepage?: string;
  /** The repository information of the package. */
  repository?:
    | {
        /** Type of the repository (e.g., git). */
        type: string;
        /** URL of the repository. */
        url: string;
      }
    | string;
  /** The bugs URL or object for the package. */
  bugs?:
    | {
        /** URL for reporting bugs. */
        url: string;
      }
    | string;
  /** The dependencies of the package. */
  dependencies?: Record<string, string>;
  /** The development dependencies of the package. */
  devDependencies?: Record<string, string>;
  /** The keywords associated with the package. */
  keywords?: string[];
  /** The maintainers of the package. */
  maintainers?: Array<{ name: string; email?: string }>;
  /** The time information for the package. */
  time?: Record<string, string>;
  /** The versions of the package. */
  versions?: Record<string, any>;
  /** The README content of the package. */
  readme?: string;
  /** The distribution tags for the package. */
  "dist-tags"?: {
    /** The latest version tag. */
    latest: string;
    [tag: string]: string;
  };
}

//----------------- GITHUB INTERFACES --------------------//

/**
 * Represents a GitHub event.
 */
interface GitHubEvent {
  /** The unique identifier of the event. */
  id: string;
  /** The type of the event. */
  type: string;
  /** The actor who triggered the event. */
  actor: {
    /** The ID of the actor. */
    id: number;
    /** The login name of the actor. */
    login: string;
    /** The avatar URL of the actor. */
    avatar_url: string;
  };
  /** The repository associated with the event. */
  repo: {
    /** The ID of the repository. */
    id: number;
    /** The name of the repository. */
    name: string;
    /** The URL of the repository. */
    url: string;
  };
  /** The payload of the event. */
  payload: any;
  /** Whether the event is public. */
  public: boolean;
  /** The creation date of the event. */
  created_at: string;
}

/**
 * Represents a GitHub user.
 */
interface GitHubUser {
  /** The type of the user (e.g., User, Organization). */
  type: string;
  /** The login name of the user. */
  login: string;
  /** The unique identifier of the user. */
  id: number;
  /** The avatar URL of the user. */
  avatar_url: string;
  /** The HTML URL of the user's profile. */
  html_url: string;
  /** The display name of the user. */
  name: string;
  /** The company of the user. */
  company: string;
  /** The blog URL of the user. */
  blog: string;
  /** The location of the user. */
  location: string;
  /** The email of the user. */
  email: string;
  /** The bio of the user. */
  bio: string;
  /** The Twitter username of the user. */
  twitter_username: string;
  /** The number of public repositories. */
  public_repos: number;
  /** The number of public gists. */
  public_gists: number;
  /** The number of followers. */
  followers: number;
  /** The number of users the user is following. */
  following: number;
  /** The creation date of the user. */
  created_at: string;
  /** The last update date of the user. */
  updated_at: string;
}

/**
 * Represents a GitHub organization.
 */
interface GitHubOrganization {
  /** The login name of the organization. */
  login: string;
  /** The unique identifier of the organization. */
  id: number;
  /** The API URL of the organization. */
  url: string;
  /** The avatar URL of the organization. */
  avatar_url: string;
  /** The description of the organization. */
  description: string | null;
}

/**
 * Represents a GitHub follower.
 */
interface GitHubFollower {
  /** The login name of the follower. */
  login: string;
  /** The unique identifier of the follower. */
  id: number;
  /** The avatar URL of the follower. */
  avatar_url: string;
  /** The HTML URL of the follower's profile. */
  html_url: string;
}

/**
 * Represents a GitHub gist.
 */
interface GitHubGist {
  /** The unique identifier of the gist. */
  id: string;
  /** The HTML URL of the gist. */
  html_url: string;
  /** The files contained in the gist. */
  files: Record<
    string,
    {
      /** The filename of the gist file. */
      filename: string;
      /** The MIME type of the gist file. */
      type: string;
      /** The programming language of the gist file. */
      language: string;
      /** The size of the gist file in bytes. */
      size: number;
      /** The content of the gist file. */
      content?: string;
    }
  >;
  /** Whether the gist is public. */
  public: boolean;
  /** The creation date of the gist. */
  created_at: string;
  /** The last update date of the gist. */
  updated_at: string;
  /** The description of the gist. */
  description: string | null;
}

/**
 * Represents a GitHub repository.
 */
interface GitHubRepo {
  /** The unique identifier of the repository. */
  id: number;
  /** The name of the repository. */
  name: string;
  /** The full name of the repository (including owner). */
  full_name: string;
  /** The owner of the repository. */
  owner: GitHubUser;
  /** The HTML URL of the repository. */
  html_url: string;
  /** The description of the repository. */
  description: string;
  /** Whether the repository is a fork. */
  fork: boolean;
  /** The creation date of the repository. */
  created_at: string;
  /** The last update date of the repository. */
  updated_at: string;
  /** The last push date of the repository. */
  pushed_at: string;
  /** The homepage URL of the repository. */
  homepage: string;
  /** The size of the repository. */
  size: number;
  /** The number of stargazers. */
  stargazers_count: number;
  /** The number of watchers. */
  watchers_count: number;
  /** The main programming language of the repository. */
  language: string;
  /** The number of forks. */
  forks_count: number;
  /** The number of open issues. */
  open_issues_count: number;
  /** The license information of the repository. */
  license: {
    /** The key of the license. */
    key: string;
    /** The name of the license. */
    name: string;
    /** The SPDX identifier of the license. */
    spdx_id: string;
    /** The URL of the license. */
    url: string;
  };
  /** The topics associated with the repository. */
  topics: string[];
  /** The default branch of the repository. */
  default_branch: string;
  /** The visibility of the repository. */
  visibility: string;
  /** Whether the repository is archived. */
  archived: boolean;
  /** Whether the repository is disabled. */
  disabled: boolean;
}

/**
 * Represents the result of a GitHub search.
 */
interface GitHubSearchResult {
  /** The total number of results. */
  total_count: number;
  /** Whether the results are incomplete. */
  incomplete_results: boolean;
  /** The items returned by the search. */
  items: (GitHubUser | GitHubRepo)[];
}

/**
 * Namespace for GitHub message interfaces.
 */
namespace GithubMessage {
  /** Represents a GitHub user. */
  export interface User extends GitHubUser {}
  /** Represents a GitHub repository. */
  export interface Repo extends GitHubRepo {}
  /** Represents a GitHub search result. */
  export interface SearchResult extends GitHubSearchResult {}
  /** Represents a GitHub event. */
  export interface Event extends GitHubEvent {}
  /** Represents a GitHub organization. */
  export interface Organization extends GitHubOrganization {}
  /** Represents a GitHub follower. */
  export interface Follower extends GitHubFollower {}
  /** Represents a GitHub gist. */
  export interface Gist extends GitHubGist {}
}

//----------------- ROLE ASSIGNMENT INTERFACE --------------------//

/**
 * Configuration for assigning roles to users or bots.
 *
 * @remarks
 * This interface defines the structure of the configuration object used
 * to manage role assignments in a Discord server.
 *
 * @example
 * ```ts
 * const config: RoleAssignmentConfig = {
 *   roles: ["1234567890"],
 *   delay: 1000,
 *   target: "users",
 *   skipExisting: true,
 *   logChannel: "0987654321"
 * };
 * ```
 */
export interface RoleAssignmentConfig {
  /**
   * Array of role IDs to be assigned.
   * These are the roles that will be granted to the target users or bots.
   */
  roles: string[];
  /**
   * Delay in milliseconds between each role assignment.
   * This is used to prevent rate-limiting issues when assigning roles in bulk.
   */
  delay: number;
  /**
   * Target audience for the role assignment.
   * This specifies whether the roles should be assigned to users, bots, or both.
   * - "users": Assign roles only to users.
   * - "bots": Assign roles only to bots.
   * - "all": Assign roles to both users and bots.
   */
  target: "users" | "bots" | "all";
  /**
   * Whether to skip assigning roles to users or bots that already have them.
   * If `true`, the system will not reassign roles that the target already possesses.
   */
  skipExisting: boolean;
  /**
   * The ID of the channel where logs will be sent.
   * If `null`, no logging will occur.
   */
  logChannel: string | null;
}

/**
 * Represents the format of a Discord button.
 */
export interface ButtonFormat {
  /** The custom ID of the button. */
  customId: string;
  /** The label of the button. */
  label: string;
  /** The URL of the button, if applicable. */
  url?: string;
  /** The style of the button. */
  style: ButtonStyle;
}

//----------------- ANIME INTERFACES --------------------//

/**
 * Represents the data structure for anime information.
 */
interface AnimeData {
  /** The array of anime data objects. */
  data: [
    {
      /** The unique identifier of the anime. */
      id: string;
      /** The type of the anime. */
      type: string;
      /** The attributes of the anime. */
      attributes: {
        /** The titles of the anime in different languages. */
        titles: {
          /** The English/Japanese title. */
          en_jp: string;
        };
        /** The synopsis of the anime. */
        synopsis: string;
        /** The status of the anime (e.g., finished, airing). */
        status: string;
        /** The subtype of the anime (e.g., TV, movie). */
        subtype: string;
        /** The ranking of the anime by rating. */
        ratingRank: number;
        /** The number of episodes. */
        episodeCount?: number;
        /** The popularity ranking of the anime. */
        popularityRank: number;
        /** The average rating of the anime. */
        averageRating: string;
        /** The length of each episode in minutes. */
        episodeLength?: number;
        /** The start date of the anime. */
        startDate: string;
        /** The end date of the anime. */
        endDate?: string;
        /** The poster image of the anime. */
        posterImage: {
          /** The small version of the poster image. */
          small: string;
        };
        /** The cover image of the anime. */
        coverImage: {
          /** The tiny version of the cover image. */
          tiny: string;
        };
        /** The YouTube video ID for the anime trailer. */
        youtubeVideoId?: string;
      };
      /** The relationships of the anime, such as genres. */
      relationships: {
        /** The genres relationship. */
        genres: {
          /** The related links for genres. */
          links: {
            /** The related URL for genres. */
            related: string;
          };
        };
      };
    },
  ];
}

/**
 * Represents the data structure for anime genres.
 */
interface GenreData {
  /** The array of genre data objects. */
  data: Array<{
    /** The attributes of the genre. */
    attributes: {
      /** The name of the genre. */
      name: string;
    };
  }>;
}

/**
 * Namespace for entertainment-related interfaces.
 */
namespace Entretenment {
  /** Represents anime data. */
  export interface Anime extends AnimeData {}
  /** Represents genre data. */
  export interface Genre extends GenreData {}
}

//----------------- GIVEAWAY INTERFACES --------------------//

/**
 * Represents the data structure for a giveaway.
 */
interface GiveawayData {
  /** The prize for the giveaway. */
  prize?: string;
  /** The duration of the giveaway in milliseconds. */
  duration?: number;
  /** The channel ID where the giveaway is hosted. */
  channelId?: string;
  /** The number of winners for the giveaway. */
  winners?: number;
  /** The requirements for entering the giveaway. */
  requirements?: {
    /** The required role IDs to participate. */
    roles?: string[];
    /** The minimum account age required to participate. */
    accountAge?: number;
    /** The minimum message count required to participate. */
    messageCount?: number;
  };
}

/**
 * Represents the requirements for entering a giveaway.
 *
 * @property requiredRoles - Array of role IDs required to participate.
 * @property minAccountAge - Minimum account age (in days) required to participate.
 * @property minMessages - Minimum number of messages required to participate.
 *
 * @see {@link https://github.com/Androz2091/discord-giveaways#start-a-giveaway discord-giveaways documentation}
 */
interface GiveawayRequirements {
  /**
   * Array of role IDs required to participate.
   */
  requiredRoles?: string[];
  /**
   * Minimum account age (in days) required to participate.
   */
  minAccountAge?: number;
  /**
   * Minimum number of messages required to participate.
   */
  minMessages?: number;
}

/**
 * Extended options for starting a giveaway, including custom requirements.
 *
 * @see {@link https://github.com/Androz2091/discord-giveaways#start-a-giveaway discord-giveaways documentation}
 * @property requirements - Optional requirements for participants.
 */
interface ExtendedGiveawayOptions extends GiveawayStartOptions<GiveawayRequirements> {
  /**
   * Optional requirements for participants.
   */
  requirements?: GiveawayRequirements;
}

/**
 * Namespace for giveaway-related interfaces.
 */
namespace GiveawayInterface {
  /** Represents the options for starting a giveaway. */
  export interface StartOptions extends ExtendedGiveawayOptions {}
  /** Represents the requirements for a giveaway. */
  export interface Requirements extends GiveawayRequirements {}
  /** Represents the extended options for a giveaway. */
  export interface Options extends ExtendedGiveawayOptions {}
  /** Represents the data for a giveaway. */
  export interface Data extends GiveawayData {}
}

//----------------- EXPORTS --------------------//

/**
 * Represents the status and information of a Minecraft server.
 */
export interface MinecraftServer {
  /** Whether the server is online. */
  online: boolean;
  /** The IP address of the server. */
  ip: string;
  /** The port of the server. */
  port?: number;
  /** The hostname of the server. */
  hostname?: string;
  /** The version of the server. */
  version?: string;
  /** Debug information for the server. */
  debug?: {
    ping: boolean;
    query: boolean;
    bedrock: boolean;
    srv: boolean;
    querymismatch: boolean;
    ipinsrv: boolean;
    cnameinsrv: boolean;
    animatedmotd: boolean;
    cachehit: boolean;
    cachetime: number;
    cacheexpire: number;
    apiversion: number;
  };
  /** The protocol information of the server. */
  protocol?: {
    version: number;
    name?: string;
  };
  /** The server icon as a base64 string. */
  icon?: string;
  /** The software used by the server. */
  software?: string;
  /** The map information of the server. */
  map?: {
    raw: string;
    clean: string;
    html: string;
  };
  /** The gamemode of the server. */
  gamemode?: string;
  /** The server ID. */
  serverid?: string;
  /** Whether the server is blocked by EULA. */
  eula_blocked?: boolean;
  /** The message of the day (MOTD) of the server. */
  motd?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  /** The player information of the server. */
  players?: {
    online: number;
    max: number;
    list?: Array<{
      name: string;
      uuid: string;
    }>;
  };
  /** The plugins installed on the server. */
  plugins?: Array<{
    name: string;
    version: string;
  }>;
  /** The mods installed on the server. */
  mods?: Array<{
    name: string;
    version: string;
  }>;
  /** Additional information about the server. */
  info?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
}

/**
 * Represents a Docker image.
 */
export interface DockerImage {
  /** The repository name of the image. */
  repo_name: string;
  /** The short description of the image. */
  short_description?: string;
  /** The number of stars for the image. */
  star_count: number;
  /** The number of pulls for the image. */
  pull_count: number;
  /** Whether the image is automated. */
  is_automated?: boolean;
  /** Whether the image is official. */
  is_official?: boolean;
  /** The last updated date of the image. */
  last_updated?: string;
}

/**
 * Represents detailed information about a Docker image.
 */
export interface DockerImageDetail extends DockerImage {
  /** The full description of the image. */
  full_description?: string;
  /** The tags associated with the image. */
  tags?: string[];
  /** The user who owns the image. */
  user?: string;
}

/**
 * Represents a PyPI package.
 */
export interface PyPIPackage {
  /** The info object containing metadata about the package. */
  info: {
    /** The name of the package. */
    name: string;
    /** The version of the package. */
    version: string;
    /** The summary of the package. */
    summary?: string;
    /** The description of the package. */
    description?: string;
    /** The author of the package. */
    author?: string;
    /** The author's email. */
    author_email?: string;
    /** The license of the package. */
    license?: string;
    /** The home page URL of the package. */
    home_page?: string;
    /** The project URLs. */
    project_urls?: Record<string, string>;
    /** The required distributions. */
    requires_dist?: string[];
    /** The required Python version. */
    requires_python?: string;
    /** The classifiers for the package. */
    classifiers?: string[];
  };
  /** The releases of the package. */
  releases: Record<string, any[]>;
  /** The URLs associated with the package. */
  urls?: any[];
}

/**
 * Represents a suggestion object.
 */
export interface Suggest {
  /** The unique identifier of the suggestion. */
  suggestId: string;
  /** The message ID associated with the suggestion. */
  messageId: string;
  /** The content of the suggestion. */
  content: string;
  /** The image URL associated with the suggestion, if any. */
  imageUrl: string | null;
  /** The author ID of the suggestion. */
  authorId: string;
  /** The guild ID where the suggestion was made. */
  guildId: string;
  /** The status of the suggestion. */
  status: string;
  /** The number of upvotes for the suggestion. */
  upvotes: number;
  /** The number of downvotes for the suggestion. */
  downvotes: number;
  /** The IDs of users who voted for the suggestion. */
  voters: string[];
  /** The IDs of users who downvoted the suggestion. */
  downvoters: string[];
  /** The ID of the last voter. */
  lastVoter: string;
}

/**
 * Represents a custom Discord interaction, which can be a button, menu, or modal interaction.
 */
export type CustomInteraction =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ModalSubmitInteraction;
