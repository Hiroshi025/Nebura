import { ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

/**
 * Extends the Discord.js ModalBuilder for custom modal row logic.
 *
 * @remarks
 * This class can be used to create and configure Discord modals for user interactions.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ModalBuilder}
 */
export class ModalRow extends ModalBuilder {
  constructor() {
    super();
  }
}

/**
 * Extends the Discord.js TextInputBuilder for standardized text input rows.
 *
 * @param required - Whether the text input is required.
 *
 * @remarks
 * This class sets the input style to Paragraph, marks it as required or optional,
 * and sets a maximum length of 5000 characters by default.
 *
 * @example
 * const input = new TextInputRow(true)
 *   .setCustomId('feedback')
 *   .setLabel('Your feedback');
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/TextInputBuilder}
 * @see {@link https://discord.com/developers/docs/interactions/modals}
 */
export class TextInputRow extends TextInputBuilder {
  constructor(required: boolean) {
    super();
    this.setStyle(TextInputStyle.Paragraph);
    this.setRequired(required);
    this.setMaxLength(5000);
  }
}
