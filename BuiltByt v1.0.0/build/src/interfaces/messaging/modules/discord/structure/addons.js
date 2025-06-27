"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9b688c13-ea48-5f8a-b434-175fadcb3092")}catch(e){}}();

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
//# sourceMappingURL=addons.js.map
//# debugId=9b688c13-ea48-5f8a-b434-175fadcb3092
