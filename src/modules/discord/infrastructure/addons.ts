import { config } from "@/shared/utils/config";
import { AddonConfig } from "@/typings/discord";

import { MainDiscord } from "./client";

/**
 * @name Addons
 * @description A class that represents an addon for the bot.
 * @version 1.0.0
 * @author MikaboshiDev
 *
 * @alias Addon
 * @class
 */
export class Addons {
  /**
   * A function that initializes the addon with the provided client and configuration.
   *
   * @type {(client: BotCore, configuration: typeof config) => void}
   * @readonly
   */
  readonly initialize: (client: MainDiscord, configuration: typeof config) => void;

  /**
   * The structure defining the configuration of the addon.
   *
   * @type {AddonConfig}
   * @readonly
   */
  readonly structure: AddonConfig;

  /**
   * Creates an instance of Addons.
   *
   * @param structure - The configuration structure of the addon.
   * @param initialize - The initialization function that sets up the addon, which takes a `BotCore` client and a configuration object.
   */
  constructor(
    structure: AddonConfig,
    initialize: (client: MainDiscord, configuration: typeof config) => void,
  ) {
    this.structure = structure;
    this.initialize = initialize;
  }
}
