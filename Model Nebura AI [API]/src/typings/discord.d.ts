import {
  AutocompleteInteraction,
  ChannelSelectMenuInteraction,
  ModalSubmitInteraction,
  PermissionResolvable,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from "discord.js";

import { MyClient } from "@/modules/discord/infrastructure/client";

/**
 * Options for configuring a command.
 */
export interface CommandOptions {
  /**
   * Cooldown time in seconds for the command.
   */
  cooldown?: number;

  /**
   * Indicates if the command is restricted to the bot owner.
   */
  owner?: boolean;

  /**
   * Function to handle autocomplete interactions for the command.
   *
   * @param client - The main Discord client instance.
   * @param interaction - The autocomplete interaction object.
   * @param configuration - The bot's configuration object.
   */
  autocomplete?: (
    client: MyClient,
    interaction: AutocompleteInteraction,
    configuration: typeof config,
  ) => void;
}

/**
 * Types of files that can be used in the bot.
 */
export type FileType = "buttons" | "modals" | "menus";

/**
 * Base interface for component data.
 */
export interface componentData {
  /**
   * Unique identifier for the component.
   */
  id: string;

  /**
   * Indicates if the component is related to tickets.
   */
  tickets: boolean;

  /**
   * Indicates if the component is restricted to the bot owner.
   */
  owner: boolean;

  /**
   * Indicates if the component is under maintenance.
   */
  maintenance?: boolean;

  /**
   * Permissions required by the user to interact with the component.
   */
  permissions: PermissionResolvable[];

  /**
   * Permissions required by the bot to execute the component.
   */
  botpermissions: PermissionResolvable[];
}

/**
 * Interface for button components.
 */
export interface Buttons extends componentData {
  /**
   * Function to execute when the button is interacted with.
   *
   * @param interaction - The button interaction object.
   * @param client - The bot client instance.
   * @param language - The language code for localization.
   * @param configuration - The bot's configuration object.
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
 */
export interface Menus extends componentData {
  /**
   * Function to execute when the menu is interacted with.
   *
   * @param interaction - The menu interaction object, which can be one of several types.
   * @param client - The bot client instance.
   * @param language - The language code for localization.
   * @param configuration - The bot's configuration object.
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
 */
export interface Modals extends componentData {
  /**
   * Function to execute when the modal is submitted.
   *
   * @param interaction - The modal submit interaction object.
   * @param client - The bot client instance.
   * @param language - The language code for localization.
   * @param configuration - The bot's configuration object.
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
 */
export interface AddonConfig {
  /**
   * Name of the addon.
   */
  name: string;

  /**
   * Description of the addon.
   */
  description: string;

  /**
   * Author of the addon.
   */
  author: string;

  /**
   * Version of the addon.
   */
  version: string;

  /**
   * Permissions required by the addon.
   */
  bitfield: PermissionResolvable[];
}
