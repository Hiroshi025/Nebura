import { ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export class ModalRow extends ModalBuilder {
  constructor() {
    super();
  }
}

export class TextInputRow extends TextInputBuilder {
  constructor(required: boolean) {
    super();
    this.setStyle(TextInputStyle.Paragraph);
    this.setRequired(required);
    this.setMaxLength(5000);
  }
}