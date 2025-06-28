import { GiveawayStartOptions } from "discord-giveaways";
import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Message,
  ModalSubmitInteraction,
  PermissionResolvable,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from "discord.js";

import { MyDiscord } from "@/interfaces/messaging/modules/discord/client";

//----------------- DISCORD INTERFACES --------------------//

export interface Fields {
  name: string;
  value: string;
  inline: boolean;
}

/**
 * Options for configuring a command.
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

export interface NPMPackage {
  name: string;
  version: string;
  description: string;
  author?:
    | {
        name: string;
        email?: string;
        url?: string;
      }
    | string;
  license?: string;
  homepage?: string;
  repository?:
    | {
        type: string;
        url: string;
      }
    | string;
  bugs?:
    | {
        url: string;
      }
    | string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  keywords?: string[];
  maintainers?: Array<{ name: string; email?: string }>;
  time?: Record<string, string>;
  versions?: Record<string, any>;
  readme?: string;
  "dist-tags"?: {
    latest: string;
    [tag: string]: string;
  };
}

//----------------- GITHUB INTERFACES --------------------//

interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: any;
  public: boolean;
  created_at: string;
}

interface GitHubUser {
  type: string;
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

interface GitHubOrganization {
  login: string;
  id: number;
  url: string;
  avatar_url: string;
  description: string | null;
}

interface GitHubFollower {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

interface GitHubGist {
  id: string;
  html_url: string;
  files: Record<
    string,
    {
      filename: string;
      type: string;
      language: string;
      size: number;
      content?: string;
    }
  >;
  public: boolean;
  created_at: string;
  updated_at: string;
  description: string | null;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  html_url: string;
  description: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
  };
  topics: string[];
  default_branch: string;
  visibility: string;
  archived: boolean;
  disabled: boolean;
}

interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: (GitHubUser | GitHubRepo)[];
}

namespace GithubMessage {
  export interface User extends GitHubUser {}
  export interface Repo extends GitHubRepo {}
  export interface SearchResult extends GitHubSearchResult {}
  export interface Event extends GitHubEvent {}
  export interface Organization extends GitHubOrganization {}
  export interface Follower extends GitHubFollower {}
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

export interface ButtonFormat {
  customId: string;
  label: string;
  url?: string;
  style: ButtonStyle;
}

//----------------- ANIME INTERFACES --------------------//

interface AnimeData {
  data: [
    {
      id: string;
      type: string;
      attributes: {
        titles: {
          en_jp: string;
        };
        synopsis: string;
        status: string;
        subtype: string;
        ratingRank: number;
        episodeCount?: number;
        popularityRank: number;
        averageRating: string;
        episodeLength?: number;
        startDate: string;
        endDate?: string;
        posterImage: {
          small: string;
        };
        coverImage: {
          tiny: string;
        };
        youtubeVideoId?: string;
      };
      relationships: {
        genres: {
          links: {
            related: string;
          };
        };
      };
    },
  ];
}

interface GenreData {
  data: Array<{
    attributes: {
      name: string;
    };
  }>;
}

namespace Entretenment {
  export interface Anime extends AnimeData {}
  export interface Genre extends GenreData {}
}

//----------------- GIVEAWAY INTERFACES --------------------//

interface GiveawayData {
  prize?: string;
  duration?: number;
  channelId?: string;
  winners?: number;
  requirements?: {
    roles?: string[];
    accountAge?: number;
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

namespace GiveawayInterface {
  export interface StartOptions extends ExtendedGiveawayOptions {}
  export interface Requirements extends GiveawayRequirements {}
  export interface Options extends ExtendedGiveawayOptions {}
  export interface Data extends GiveawayData {}
}

//----------------- EXPORTS --------------------//

export interface MinecraftServer {
  online: boolean;
  ip: string;
  port?: number;
  hostname?: string;
  version?: string;
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
  protocol?: {
    version: number;
    name?: string;
  };
  icon?: string;
  software?: string;
  map?: {
    raw: string;
    clean: string;
    html: string;
  };
  gamemode?: string;
  serverid?: string;
  eula_blocked?: boolean;
  motd?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  players?: {
    online: number;
    max: number;
    list?: Array<{
      name: string;
      uuid: string;
    }>;
  };
  plugins?: Array<{
    name: string;
    version: string;
  }>;
  mods?: Array<{
    name: string;
    version: string;
  }>;
  info?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
}

export interface DockerImage {
  repo_name: string;
  short_description?: string;
  star_count: number;
  pull_count: number;
  is_automated?: boolean;
  is_official?: boolean;
  last_updated?: string;
}

export interface DockerImageDetail extends DockerImage {
  full_description?: string;
  tags?: string[];
  user?: string;
}

export interface PyPIPackage {
  info: {
    name: string;
    version: string;
    summary?: string;
    description?: string;
    author?: string;
    author_email?: string;
    license?: string;
    home_page?: string;
    project_urls?: Record<string, string>;
    requires_dist?: string[];
    requires_python?: string;
    classifiers?: string[];
  };
  releases: Record<string, any[]>;
  urls?: any[];
}

export interface Suggest {
  suggestId: string;
  messageId: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  guildId: string;
  status: string;
  upvotes: number;
  downvotes: number;
  voters: string[];
  downvoters: string[];
  lastVoter: string;
}

export type CustomInteraction =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ModalSubmitInteraction;
