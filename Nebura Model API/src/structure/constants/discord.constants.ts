import {
	ButtonInteraction, ChannelSelectMenuInteraction, ModalSubmitInteraction,
	RoleSelectMenuInteraction, StringSelectMenuInteraction
} from "discord.js";

export type CustomInteraction = 
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ModalSubmitInteraction;
