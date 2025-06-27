"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4b2dd441-0a9c-57e1-83b9-e957ea4201f4")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = exports.Event = void 0;
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
class Event {
    /**
     * The name of the event, which corresponds to a key in `ClientEvents`.
     *
     * @type {K}
     * @readonly
     */
    event;
    /**
     * The function that runs when the event is triggered.
     * It receives arguments based on the event type.
     *
     * @type {(...args: ClientEvents[K]) => void}
     * @readonly
     */
    run;
    /**
     * Whether the event should only run once. If `true`, the event listener is removed after the first execution.
     *
     * @type {boolean | undefined}
     * @readonly
     */
    once;
    /**
     * Creates an instance of Event.
     *
     * @param event - The name of the event, which corresponds to a key in `ClientEvents`.
     * @param run - The function that executes when the event is triggered. It receives the arguments expected for that event.
     * @param once - Optional. Whether the event should run only once. Defaults to `false`.
     */
    constructor(event, run, once) {
        this.event = event;
        this.run = run;
        this.once = once;
    }
}
exports.Event = Event;
/**
 * @name Command
 * @description A class that represents a command in the bot system.
 * @version 0.0.3
 * @author MikaboshiDev
 *
 * @alias Command
 * @class
 */
class Command {
    /**
     * The structure defining the command, which can be a Slash Command, Context Menu Command,
     * or other specific command builders from `discord.js`.
     *
     * @type {SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup | CommandBuilder'>}
     * @readonly
     */
    structure;
    /**
     * The function that runs the command when invoked.
     * It receives the `BotCore` client, the command interaction, and the configuration object.
     *
     * @type {(client: BotCore, interaction: ChatInputCommandInteraction, configuration: typeof config) => void}
     * @readonly
     */
    run;
    /**
     * Optional configuration options for the command, such as cooldown or permissions.
     *
     * @type {CommandOptions | undefined}
     * @readonly
     */
    options;
    /**
     * The cooldown time for the command in seconds.
     *
     * @type {number | undefined}
     * @readonly
     */
    cooldown;
    /**
     * Indicates whether the command is under maintenance.
     *
     * @type {boolean | undefined}
     * @readonly
     */
    maintenance;
    /**
     * Creates an instance of Command.
     *
     * @param structure - The command structure, which can be a Slash Command, Context Menu Command, or other supported command builders.
     * @param run - The function that runs when the command is executed, receiving the bot client, the interaction, and configuration.
     * @param options - Optional settings for the command, such as cooldown and other command-related options.
     * @param cooldown - Optional cooldown time in seconds to prevent command spam. Defaults to `10` seconds.
     * @param maintenance - Optional flag to indicate if the command is under maintenance. Defaults to `false`.
     */
    constructor(structure, run, options, cooldown = 10, // Default cooldown set to 10 seconds
    maintenance = false) {
        this.structure = structure;
        this.run = run;
        this.options = options;
        this.cooldown = cooldown;
        this.maintenance = maintenance;
    }
}
exports.Command = Command;
//# sourceMappingURL=builders.js.map
//# debugId=4b2dd441-0a9c-57e1-83b9-e957ea4201f4
