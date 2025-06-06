import {
	ButtonInteraction, ChannelSelectMenuInteraction, ModalSubmitInteraction,
	RoleSelectMenuInteraction, StringSelectMenuInteraction
} from "discord.js";

/**
 * Represents a custom interaction type that can be one of several specific interaction types
 * provided by the Discord.js library.
 *
 * This type is used to define interactions that are commonly handled in Discord bots.
 *
 * @typedef {CustomInteraction}
 * @type {ButtonInteraction | StringSelectMenuInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction | ModalSubmitInteraction}
 * 
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ButtonInteraction ButtonInteraction}
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/StringSelectMenuInteraction StringSelectMenuInteraction}
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ChannelSelectMenuInteraction ChannelSelectMenuInteraction}
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/RoleSelectMenuInteraction RoleSelectMenuInteraction}
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ModalSubmitInteraction ModalSubmitInteraction}
 */
export type CustomInteraction = 
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ModalSubmitInteraction;
