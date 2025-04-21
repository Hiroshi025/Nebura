import { profileImage } from "discord-arts";
import {
	AttachmentBuilder, ButtonBuilder, ButtonStyle, GuildChannel, Message, MessageEditAttachmentData,
	PermissionFlagsBits, StringSelectMenuOptionBuilder, TextChannel
} from "discord.js";

import { main } from "@/main";
import { config } from "@utils/config";
import { logWithLabel } from "@utils/functions/console";

import { MyClient } from "../client";

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

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function countMessage(userId: string, guildId: string) {
  const data = await main.prisma.userEconomy.findFirst({
    where: {
      userId,
    },
  });

  if (!data || !data.messageCount) return false;
  await main.prisma.userEconomy.updateMany({
    where: {
      userId,
      guildId,
    },
    data: {
      messageCount: data.messageCount + 1,
    },
  });

  return true;
}

export function generateToken(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function toFixedNumber(number: number, places = 2) {
  const offset = Number(`1e${places}`);
  return Math.floor(number * offset) / offset;
}

/**
 * Validates if a string is a valid ObjectID or a Discord snowflake ID.
 *
 * @param id - The string to validate.
 * @returns True if the string is a valid ObjectID or Discord ID, otherwise false.
 */
function isValidObjectId(id: string): boolean {
  const objectIdPattern = /^[a-fA-F0-9]{24}$/; // MongoDB ObjectID pattern
  const discordIdPattern = /^\d{17,20}$/; // Discord snowflake ID pattern
  return objectIdPattern.test(id) || discordIdPattern.test(id);
}

export async function fetchBalance(userId: string, guildId: string) {
  if (!isValidObjectId(userId)) {
    console.error(`Invalid userId format: ${userId}`);
    throw new Error("Invalid userId format. Must be a valid ObjectID.");
  }

  if (!isValidObjectId(guildId)) {
    console.error(`Invalid guildId format: ${guildId}`);
    throw new Error("Invalid guildId format. Must be a valid ObjectID.");
  }

  let dbBalance = await main.prisma.userEconomy.findFirst({
    where: {
      userId: userId,
      guildId: guildId,
    },
  });

  if (!dbBalance) {
    dbBalance = await main.prisma.userEconomy.create({
      data: {
        userId: userId,
        guildId: guildId,
        balance: 0,
      },
    });

    return dbBalance;
  }

  return dbBalance;
}

/**
 * Fetches the balance of a user in a specific guild.
 *
 * @param userId
 * @param guildId
 * @returns
 */
export async function getBalance(userId: string, guildId: string) {
  if (!isValidObjectId(userId)) {
    console.error(`Invalid userId format: ${userId}`);
    throw new Error("Invalid userId format. Must be a valid ObjectID.");
  }

  if (!isValidObjectId(guildId)) {
    console.error(`Invalid guildId format: ${guildId}`);
    throw new Error("Invalid guildId format. Must be a valid ObjectID.");
  }

  let dbBalance = await main.prisma.userEconomy.findFirst({
    where: {
      userId: userId,
      guildId: guildId,
    },
  });

  if (!dbBalance) return false;
  return dbBalance;
}

/**
 * Updates the economy balance of a user in a specific guild by adding a random amount.
 *
 * @param message - The Discord message object.
 */
export async function Economy(message: Message) {
  if (message.author.bot || !message.guild) return;

  const randomAmount = Math.random() * (0.7 - 0.3) + 0.3;
  const dbBalance = await fetchBalance(message.author.id, message.guild.id);

  console.log(await toFixedNumber(dbBalance.balance + randomAmount));

  await main.prisma.userEconomy.updateMany({
    where: { userId: message.author.id },
    data: {
      balance: await toFixedNumber(dbBalance.balance + randomAmount),
    },
  });
}

export async function createUser(userId: string) {
  if (!isValidObjectId(userId)) {
    console.error(`Invalid userId format: ${userId}`);
    throw new Error("Invalid userId format. Must be a valid ObjectID.");
  }

  const dbUser = await main.prisma.userDiscord.findFirst({
    where: {
      userId: userId,
    },
  });

  if (!dbUser) {
    await main.prisma.userDiscord.create({
      data: {
        userId: userId,
      },
    });
  }

  return dbUser;
}

const cooldown = new Set<string>();

/**
 * Handles the ranking system for users in a Discord server.
 *
 * @param message
 * @param client
 * @returns
 */
export async function Ranking(message: Message, client: MyClient) {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  // Cooldown check
  if (cooldown.has(userId)) {
    logWithLabel("custom", `User: ${message.author.tag} | Cooldown activated.`, "Ranking");
    return;
  }

  // Fetch ranking channel configuration from the database
  let rankingChannel = await main.prisma.levelConfig.findFirst({
    where: { guildId, status: true },
  });

  // If no configuration exists, create a default one
  if (!rankingChannel) {
    rankingChannel = await main.prisma.levelConfig.create({
      data: { guildId, channelId: null, status: true },
    });
  }

  // Skip if the ranking system is disabled
  if (!rankingChannel.status) return;

  // Generate random XP and fetch user data from the database
  const xpAmount = Math.floor(Math.random() * (25 - 15 + 1) + 15);
  let user = await main.prisma.userLevel.findFirst({
    where: { guildId, userId },
  });

  // Update or create user data
  user = await main.prisma.userLevel.upsert({
    where: {
      guildId_userId: {
        guildId: guildId,
        userId: userId,
      },
    },
    update: {
      xp: { increment: xpAmount },
    },
    create: {
      guildId: guildId,
      userId: userId,
      xp: xpAmount,
      level: 0,
    },
  });

  let { xp, level } = user;

  logWithLabel(
    "custom",
    `User talking: ${message.author.tag} | XP: ${xp} | Level: ${level} and earned ${xpAmount} XP.`,
    "Ranking",
  );

  // Check for level-up
  if (xp >= level * 100) {
    level++;
    xp = 0;

    let notificationChannel: GuildChannel | null = null;

    // Fetch the notification channel if configured
    if (rankingChannel.channelId) {
      try {
        notificationChannel = (await client.channels.fetch(
          rankingChannel.channelId,
        )) as GuildChannel;
      } catch (err) {
        console.error(err);
      }
    }

    // Use the current channel if no notification channel is set
    if (!notificationChannel) {
      notificationChannel = message.channel as GuildChannel;
    }

    // Check for permission to send messages
    if (notificationChannel.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages)) {
      const buffer = await profileImage(userId, {
        customTag: `You leveled up to: ${level}!`,
      });

      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });

      (notificationChannel as TextChannel).send({ files: [attachment] });
    } else {
      // Send a DM if the bot can't send messages in the channel
      const buffer = await profileImage(userId, {
        customTag: `You leveled up to: ${level}!`,
      });

      await message.author.send({
        content: `You leveled up to: ${level}!`,
        files: [new AttachmentBuilder(buffer, { name: "profile.png" })],
      });
    }

    // Update the user's level in the database
    await main.prisma.userLevel.update({
      where: { id: user.id },
      data: { xp, level },
    });

    // Set cooldown to prevent spam
    cooldown.add(userId);
    setTimeout(() => cooldown.delete(userId), 60000);
  }
}

export async function createGuild(guildId: string, client: MyClient) {
  if (!guildId || !client.user) return false;

  const guild = await main.prisma.myGuild.findFirst({
    where: {
      guildId,
    },
  });

  const data = await main.prisma.myDiscord.findFirst({
    where: {
      clientId: config.modules.discord.clientId,
      token: config.modules.discord.token,
    },
  });

  if (!data) return;

  if (!guild) {
    await main.prisma.myGuild.create({
      data: {
        guildId: guildId,
        discordId: data.clientId
      },
    });
  }

  return true;
}
