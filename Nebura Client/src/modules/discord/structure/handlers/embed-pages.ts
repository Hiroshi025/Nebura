import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder,
	Message, MessageActionRowComponentBuilder, MessageComponentInteraction
} from "discord.js";

import { ButtonOptions, PaginationButtons, PaginationOptions } from "@/typings/utils";

export default class EmbedPagination {
  private interaction: ChatInputCommandInteraction;
  private pages: EmbedBuilder[];
  private pageIndex: number;
  private collector: any;
  private message: Message | null;
  private options: PaginationOptions;

  constructor(interaction: ChatInputCommandInteraction) {
    if (!interaction || !(interaction instanceof ChatInputCommandInteraction)) {
      throw new Error(
        "Invalid interaction instance provided. Ensure you pass a valid Discord.js Interaction.",
      );
    }

    this.interaction = interaction;
    this.pages = [];
    this.pageIndex = 0;
    this.collector = null;
    this.message = null;
    this.options = {
      method: null,
      keepIndex: false,
      buttons: {
        first: {
          label: "≪",
          style: ButtonStyle.Primary,
        },
        previous: {
          label: "⇐",
          style: ButtonStyle.Primary,
        },
        index: {
          disabled: false,
          label: "[ {index} / {max} ]",
          style: ButtonStyle.Secondary,
        },
        next: {
          label: "⇒",
          style: ButtonStyle.Primary,
        },
        last: {
          label: "≫",
          style: ButtonStyle.Primary,
        },
      },
    };
  }

  keepIndexCount(input: boolean): this {
    if (typeof input !== "boolean") {
      throw new Error("Invalid Input: keepIndex only takes Boolean as an input.");
    }
    this.options.keepIndex = input;
    return this;
  }

  hideIndexButton(input: boolean): this {
    if (typeof input !== "boolean") {
      throw new Error("Invalid Input: disableIndexButton only takes Boolean as an input.");
    }
    this.options.buttons.index.disabled = input;
    return this;
  }

  changeButton(type: keyof PaginationButtons, { label, style }: Partial<ButtonOptions>): this {
    if (!["first", "previous", "index", "next", "last"].includes(type)) {
      throw new Error(
        'Invalid Type: You need to specify which button to change! Available Options: ["first", "previous", "index", "next", "last"].',
      );
    }
    if (label && (typeof label !== "string" || label.length < 1 || label.length > 25)) {
      throw new Error(
        "Invalid Label: Label must be a valid string and between 1 and 25 in length!",
      );
    }
    if (style && !Object.values(ButtonStyle).includes(style)) {
      throw new Error(
        "Invalid Style: Style must be a valid 'Style String Type' or direct instance of ButtonStyle!",
      );
    }

    if (label) this.options.buttons[type].label = label;
    if (style) this.options.buttons[type].style = style;

    return this;
  }

  addPages(embedsArray: EmbedBuilder[]): this {
    if (
      !Array.isArray(embedsArray) ||
      embedsArray.some((embed) => !(embed instanceof EmbedBuilder))
    ) {
      throw new Error(
        "Invalid embeds array: Provide an array consisting only of EmbedBuilder instances.",
      );
    }
    if (this.options.method && this.options.method !== "addEmbeds") {
      throw new Error("Conflicting method usage: Cannot use addPages after createPages.");
    }
    this.options.method = "addEmbeds";
    this.pages.push(...embedsArray);
    return this;
  }

  createPages(content: string[], embed: EmbedBuilder, max: number = 6): this {
    if (!Array.isArray(content) || content.some((c) => typeof c !== "string")) {
      throw new Error("Invalid content format: Provide an array of strings for pagination.");
    }
    if (max < 1 || max > 15 || isNaN(max)) {
      throw new Error("Invalid maximum value: 'max' should be a number between 1 and 15.");
    }
    if (!(embed instanceof EmbedBuilder)) {
      throw new Error(
        "Invalid embed instance: Provide a valid EmbedBuilder instance for embedding content.",
      );
    }
    if (this.options.method && this.options.method !== "createPages") {
      throw new Error("Conflicting method usage: Cannot use createPages after addPages.");
    }

    const maxPage = Math.ceil(content.length / max);

    this.pages = content.reduce((pages: EmbedBuilder[], _, i) => {
      if (i % max === 0) {
        const pageContent = [embed.data.description, ...content.slice(i, i + max)]
          .filter(Boolean)
          .join("\n\n");
        const newEmbed = EmbedBuilder.from(embed)
          .setDescription(pageContent)
          .setFooter({
            text: `Page ${Math.floor(i / max) + 1} out of ${maxPage}`,
          });
        pages.push(newEmbed);
      }
      return pages;
    }, []);

    this.options.method = "createPages";
    return this;
  }

  async display(): Promise<this> {
    if (!this.pages.length) {
      throw new Error("Display error: No pages are available to display.");
    }

    if (!this.options.keepIndex) {
      this.pageIndex = 0;
    } else {
      this.pageIndex =
        this.pageIndex + 1 > this.pages.length ? this.pages.length - 1 : this.pageIndex;
    }

    if (this.collector) this.collector.stop();

    if (this.options.method === "createPages") {
      if (this.interaction.isCommand()) {
        this.message = (await this.interaction.fetchReply()) as Message;
      } else {
        throw new Error("Interaction type does not support fetchReply.");
      }
    }

    let existingComponents =
      this.message?.components.map((row) => ActionRowBuilder.from(row)) || [];
    const buttons = this.#createButtons();

    existingComponents = this.#filterOutPaginationComponents(
      existingComponents as any,
    ) as ActionRowBuilder<MessageActionRowComponentBuilder>[];
    if (this.pages.length > 1) existingComponents.push(buttons);

    const response = {
      embeds: [this.pages[this.pageIndex]],
      components: existingComponents,
    };

    try {
      await this.interaction.reply({
        ...response,
        components: response.components.map((component) =>
          (component as ActionRowBuilder<MessageActionRowComponentBuilder>).toJSON(),
        ),
      });
      this.message = (await this.interaction.fetchReply()) as Message;
    } catch (e) {
      await this.interaction.editReply({
        ...response,
        components: response.components.map((component) =>
          (component as ActionRowBuilder<MessageActionRowComponentBuilder>).toJSON(),
        ),
      });
    }

    this.#updateHandling();
    return this;
  }

  #updateHandling(): void {
    this.collector = this.message!.createMessageComponentCollector({
      idle: 60000,
    });

    this.collector.on("collect", async (i: MessageComponentInteraction) => {
      if (!i.isButton() || !i.customId.startsWith("@page")) {
        return Promise.resolve(); // Explicitly return a resolved promise
      }
      if (i.user.id !== this.interaction.user.id) {
        return i.reply({
          content: "You do not have permission to use this button.",
          flags: "Ephemeral"
        });
      }

      switch (i.customId) {
        case "@pageFirst":
          this.pageIndex = 0;
          break;
        case "@pagePrev":
          this.pageIndex = Math.max(this.pageIndex - 1, 0);
          break;
        case "@pageNext":
          this.pageIndex = Math.min(this.pageIndex + 1, this.pages.length - 1);
          break;
        case "@pageLast":
          this.pageIndex = this.pages.length - 1;
          break;
      }

      await this.#updatePagination(i);
      return Promise.resolve(); // Explicitly return a resolved promise
    });

    this.collector.on("end", () => {
      this.interaction.editReply({
        components: [],
      });
    });
  }

  #createButtons(disabled: boolean = false): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const { first, previous, index, next, last } = this.options.buttons;
    const formattedLabel = index.label.replace(/{index}|{max}/g, (match) => {
      switch (match) {
        case "{index}":
          return `${this.pageIndex + 1}`;
        case "{max}":
          return `${this.pages.length}`;
        default:
          return match;
      }
    });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("@pageFirst")
        .setLabel(first.label)
        .setStyle(first.style)
        .setDisabled(disabled || this.pageIndex === 0),
      new ButtonBuilder()
        .setCustomId("@pagePrev")
        .setLabel(previous.label)
        .setStyle(previous.style)
        .setDisabled(disabled || this.pageIndex === 0),
    );

    if (!index.disabled)
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("@pageIndex")
          .setLabel(formattedLabel)
          .setStyle(index.style)
          .setDisabled(true),
      );

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("@pageNext")
        .setLabel(next.label)
        .setStyle(next.style)
        .setDisabled(disabled || this.pageIndex === this.pages.length - 1),
      new ButtonBuilder()
        .setCustomId("@pageLast")
        .setLabel(last.label)
        .setStyle(last.style)
        .setDisabled(disabled || this.pageIndex === this.pages.length - 1),
    );

    return row;
  }

  #updatePagination(interaction: MessageComponentInteraction): void {
    const buttons = this.#createButtons();
    let existingComponents: any = this.message!.components || [];

    existingComponents = this.#filterOutPaginationComponents(
      existingComponents as any,
    ) as ActionRowBuilder<MessageActionRowComponentBuilder>[];
    existingComponents.push(buttons as any);

    interaction.update({
      embeds: [this.pages[this.pageIndex]],
      components: existingComponents,
    });
  }

  #filterOutPaginationComponents(
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[],
  ): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    return components.filter((row) =>
      row.components.some(
        (component) =>
          "customId" in component &&
          typeof component.customId === "string" &&
          !component.customId.startsWith("@page"),
      ),
    );
  }
}
