import {
  AutocompleteInteraction,
  ChannelSelectMenuInteraction,
  Message,
  ModalSubmitInteraction,
  PermissionResolvable,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from "discord.js";

import { MyClient } from "@/modules/discord/structure/client";

/**
 * Options for configuring a command.
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
   */
  autocomplete?: (
    client: MyClient,
    interaction: AutocompleteInteraction,
    configuration: typeof config,
  ) => void;
}

/**
 * Types of files that can be used in the bot.
 * These represent the different component types supported by the bot.
 */
export type FileType = "buttons" | "modals" | "menus";

/**
 * Base interface for component data.
 * This interface defines the common properties shared by all bot components.
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
   * Indicates if the component is under maintenance.
   * If `true`, the component is temporarily disabled for updates or fixes.
   */
  maintenance?: boolean;

  /**
   * Permissions required by the user to interact with the component.
   * This is an array of Discord permissions that the user must have.
   */
  permissions: PermissionResolvable[];

  /**
   * Permissions required by the bot to execute the component.
   * This is an array of Discord permissions that the bot must have.
   */
  botpermissions: PermissionResolvable[];
}

/**
 * Interface for button components.
 * This interface extends `componentData` and adds functionality specific to buttons.
 */
export interface Buttons extends componentData {
  /**
   * Function to execute when the button is interacted with.
   *
   * @param interaction - The button interaction object provided by Discord.js.
   * @param client - The bot client instance, which manages the bot's state and interactions.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   */
  execute: (
    interaction: ButtonInteraction,
    client: BotClient,
    language: string,
    configuration: typeof config,
  ) => void;
}

/**
 * Interface for menu components.
 * This interface extends `componentData` and adds functionality specific to menus.
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
   */
  execute: (
    interaction:
      | StringSelectMenuInteraction
      | ChannelSelectMenuInteraction
      | RoleSelectMenuInteraction,
    client: BotClient,
    language: string,
    configuration: typeof config,
  ) => void;
}

/**
 * Interface for modal components.
 * This interface extends `componentData` and adds functionality specific to modals.
 */
export interface Modals extends componentData {
  /**
   * Function to execute when the modal is submitted.
   *
   * @param interaction - The modal submit interaction object provided by Discord.js.
   * @param client - The bot client instance, which manages the bot's state and interactions.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   */
  execute: (
    interaction: ModalSubmitInteraction,
    client: MyClient,
    language: string,
    configuration: typeof config,
  ) => void;
}

/**
 * Configuration for an addon module.
 * This interface defines the metadata and permissions required for an addon.
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
   */
  version: string;

  /**
   * Permissions required by the addon.
   * This is an array of Discord permissions that the addon needs to function.
   */
  bitfield: PermissionResolvable[];
}

/**
 * Interface for precommands.
 * Precommands are commands that can be executed via text messages in Discord.
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
   */
  permissions: PermissionResolvable[];

  /**
   * Permissions required by the bot to execute the precommand.
   * This is an array of Discord permissions that the bot must have.
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
   * Function to execute the precommand.
   *
   * @param client - The main Discord client instance.
   * @param message - The message object that triggered the command.
   * @param args - The arguments provided with the command.
   * @param prefix - The prefix used to invoke the command.
   * @param language - The language code for localization, used to provide responses in the user's language.
   * @param configuration - The bot's configuration object, containing global settings.
   */
  execute: (
    client: MyClient,
    message: Message,
    args: string[],
    prefix: string,
    language: string,
    configuration: typeof config,
  ) => void;
}
