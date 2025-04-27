"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addons = void 0;
/**
 * @name Addons
 * @description A class that represents an addon for the bot.
 * @version 1.0.0
 * @author MikaboshiDev
 *
 * @alias Addon
 * @class
 */
class Addons {
    /**
     * A function that initializes the addon with the provided client and configuration.
     *
     * @type {(client: BotCore, configuration: typeof config) => void}
     * @readonly
     */
    initialize;
    /**
     * The structure defining the configuration of the addon.
     *
     * @type {AddonConfig}
     * @readonly
     */
    structure;
    /**
     * Creates an instance of Addons.
     *
     * @param structure - The configuration structure of the addon.
     * @param initialize - The initialization function that sets up the addon, which takes a `BotCore` client and a configuration object.
     */
    constructor(structure, initialize) {
        this.structure = structure;
        this.initialize = initialize;
    }
}
exports.Addons = Addons;
