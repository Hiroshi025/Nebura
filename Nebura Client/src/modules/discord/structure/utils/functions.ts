import {
	ButtonBuilder, ButtonStyle, Message, MessageEditAttachmentData, StringSelectMenuOptionBuilder,
	TextChannel
} from "discord.js";

/**
 * Creates a new Discord button.
 * 
 * @param customId - The custom ID for the button.
 * @param label - The label displayed on the button.
 * @param style - The style of the button (e.g., Primary, Secondary, etc.).
 * @returns A `ButtonBuilder` instance representing the button.
 */
export function createButton(customId: string, label: string, style: ButtonStyle): ButtonBuilder {
  return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
}

/**
 * Generates a list of predefined menu options for a Discord select menu.
 * 
 * @returns An array of `StringSelectMenuOptionBuilder` instances representing the menu options.
 */
export function getMenuOptions(): StringSelectMenuOptionBuilder[] {
  return [
    createMenuOption("Author", "Author section of the embeds", "author"),
    createMenuOption("Author Icon", "Icon of the author section of the embeds", "author-icon"),
    createMenuOption("Title", "Title of the embeds", "title"),
    createMenuOption("Title Url", "Url of the title of the embeds", "title-url"),
    createMenuOption("Description", "Description of the embeds", "description"),
    createMenuOption("Color", "Color of the embeds", "color"),
    createMenuOption("Attachment", "Attachment of the embeds", "image"),
    createMenuOption("Thumbnail", "Thumbnail of the embeds", "thumbnail"),
    createMenuOption("Footer", "Footer of the embeds", "footer"),
    createMenuOption("Footer Icon", "Icon of the Footer of the embeds", "footer-icon"),
    createMenuOption("Timestamp", "Toggle timestamp on the embeds", "timestamp"),
    createMenuOption("Field Settings", "Add or Remove a Fields section to the embeds", "fields"),
  ];
}

/**
 * Creates a single menu option for a Discord select menu.
 * 
 * @param label - The label displayed for the menu option.
 * @param description - A brief description of the menu option.
 * @param value - The value associated with the menu option.
 * @returns A `StringSelectMenuOptionBuilder` instance representing the menu option.
 */
export function createMenuOption(
  label: string,
  description: string,
  value: string,
): StringSelectMenuOptionBuilder {
  return new StringSelectMenuOptionBuilder()
    .setLabel(label)
    .setDescription(description)
    .setValue(value);
}

/**
 * Updates a specific field in a Discord embed based on the provided option and content.
 * 
 * @param embeds - The embed object to update.
 * @param option - The field to update (e.g., "author", "title", etc.).
 * @param content - The new content for the specified field.
 * @param attachment - Optional attachment data for image-related fields.
 */
export function updateEmbedField(
  embeds: any,
  option: string,
  content: string,
  attachment?: MessageEditAttachmentData,
): void {
  switch (option) {
    case "author":
      embeds.data.author = { ...embeds.data.author, name: content };
      break;
    case "author-icon":
      embeds.data.author = {
        ...embeds.data.author,
        icon_url: validateImage(attachment, content),
      };
      break;
    case "title":
      embeds.data.title = content;
      break;
    case "title-url":
      if (content.startsWith("https://")) embeds.data.url = content;
      else temporaryMessage(embeds.channel, "Please provide a valid URL!");
      break;
    case "description":
      embeds.data.description = content;
      break;
    case "color":
      if (/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/i.test(content)) {
        embeds.data.color = hexToInt(content);
      } else {
        temporaryMessage(embeds.channel, "Please provide a valid hex color code!");
      }
      break;
    case "image":
      embeds.data.image = { url: validateImage(attachment, content) };
      break;
    case "thumbnail":
      embeds.data.thumbnail = { url: validateImage(attachment, content) };
      break;
    case "footer":
      embeds.data.footer = { ...embeds.data.footer, text: content };
      break;
    case "footer-icon":
      embeds.data.footer = {
        ...embeds.data.footer,
        icon_url: validateImage(attachment, content),
      };
      break;
  }
}

/**
 * Validates and returns a valid image URL for Discord embeds.
 * 
 * @param attachment - Optional attachment data to validate.
 * @param content - The URL or content to validate.
 * @returns A valid image URL.
 * @throws An error if the content is not a valid image or URL.
 */
export function validateImage(attachment: any | undefined, content: string): string {
  if (attachment && attachment.contentType?.includes("image")) return attachment.url;
  if (content.startsWith("https://")) return content;
  throw new Error("Discord Embeds only support images/GIFs or direct URLs!");
}

/**
 * Disables all components in the provided list of Discord components.
 * 
 * @param components - The components to disable.
 */
export function disableComponents(...components: any[]): void {
  components.forEach((component) => component.components.forEach((c: any) => c.setDisabled(true)));
}

/**
 * Enables all components in the provided list of Discord components.
 * 
 * @param components - The components to enable.
 */
export function enableComponents(...components: any[]): void {
  components.forEach((component) => component.components.forEach((c: any) => c.setDisabled(false)));
}

/**
 * Converts a hexadecimal color code to an integer.
 * 
 * @param input - The hexadecimal color code (e.g., "#FFFFFF").
 * @returns The integer representation of the color.
 */
export function hexToInt(input: string): number {
  return parseInt(
    input.replace(/^#([\da-f])([\da-f])([\da-f])$/i, "#$1$1$2$2$3$3").substring(1),
    16,
  );
}

/**
 * Sends a temporary message to a Discord text channel and deletes it after 5 seconds.
 * 
 * @param channel - The text channel to send the message to.
 * @param message - The content of the message.
 * @returns A promise that resolves when the message is deleted.
 */
export async function temporaryMessage(channel: TextChannel, message: string): Promise<void> {
  const tempMsg: Message = await channel.send(message);
  setTimeout(() => tempMsg.delete(), 5000);
}
