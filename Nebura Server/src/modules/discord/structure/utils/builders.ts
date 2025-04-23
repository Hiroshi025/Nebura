import {
  ChatInputCommandInteraction,
  ClientEvents,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

import { config } from "@/shared/utils/config";
import { CommandOptions } from "@typings/modules";

import { MyClient } from "../client";

/**
 * Class representing an event in the bot system.
 * This class defines the event name, the execution logic for the event, and whether it runs only once.
 *
 * @example
 * const event = new Event('messageCreate', (message) => {
 *   console.log(`Message received: ${message.content}`);
 * });
 *
 * @template K - A key from `ClientEvents`, representing the event name.
 * @class
 */
export class Event<K extends keyof ClientEvents> {
  /**
   * The name of the event, which corresponds to a key in `ClientEvents`.
   *
   * @type {K}
   * @readonly
   */
  readonly event: K;

  /**
   * The function that runs when the event is triggered.
   * It receives arguments based on the event type.
   *
   * @type {(...args: ClientEvents[K]) => void}
   * @readonly
   */
  readonly run: (...args: ClientEvents[K]) => void;

  /**
   * Whether the event should only run once. If `true`, the event listener is removed after the first execution.
   *
   * @type {boolean | undefined}
   * @readonly
   */
  readonly once?: boolean;

  /**
   * Creates an instance of Event.
   *
   * @param event - The name of the event, which corresponds to a key in `ClientEvents`.
   * @param run - The function that executes when the event is triggered. It receives the arguments expected for that event.
   * @param once - Optional. Whether the event should run only once. Defaults to `false`.
   */
  constructor(event: K, run: (...args: ClientEvents[K]) => void, once?: boolean) {
    this.event = event;
    this.run = run;
    this.once = once;
  }
}

/**
 * @name Command
 * @description A class that represents a command in the bot system.
 * @version 0.0.3
 * @author MikaboshiDev
 *
 * @alias Command
 * @class
 */
export class Command {
  /**
   * The structure defining the command, which can be a Slash Command, Context Menu Command,
   * or other specific command builders from `discord.js`.
   *
   * @type {SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup | CommandBuilder'>}
   * @readonly
   */
  readonly structure:
    | SlashCommandBuilder
    | ContextMenuCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

  /**
   * The function that runs the command when invoked.
   * It receives the `BotCore` client, the command interaction, and the configuration object.
   *
   * @type {(client: BotCore, interaction: ChatInputCommandInteraction, configuration: typeof config) => void}
   * @readonly
   */
  readonly run: (
    client: MyClient,
    interaction: ChatInputCommandInteraction,
    configuration: typeof config,
  ) => void;

  /**
   * Optional configuration options for the command, such as cooldown or permissions.
   *
   * @type {CommandOptions | undefined}
   * @readonly
   */
  readonly options: CommandOptions | undefined;

  /**
   * The cooldown time for the command in seconds.
   *
   * @type {number | undefined}
   * @readonly
   */
  readonly cooldown?: number;

  /**
   * Creates an instance of Command.
   *
   * @param structure - The command structure, which can be a Slash Command, Context Menu Command, or other supported command builders.
   * @param run - The function that runs when the command is executed, receiving the bot client, the interaction, and configuration.
   * @param options - Optional settings for the command, such as cooldown and other command-related options.
   * @param cooldown - Optional cooldown time in seconds to prevent command spam. Defaults to `10` seconds.
   */
  constructor(
    structure:
      | SlashCommandBuilder
      | ContextMenuCommandBuilder
      | SlashCommandOptionsOnlyBuilder
      | SlashCommandSubcommandsOnlyBuilder
      | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    run: (
      client: MyClient,
      interaction: ChatInputCommandInteraction,
      configuration: typeof config,
    ) => void,
    options?: CommandOptions,
    cooldown: number = 10, // Default cooldown set to 10 seconds
  ) {
    this.structure = structure;
    this.run = run;
    this.options = options;
    this.cooldown = cooldown;
  }
}
