import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Collection, EmbedBuilder, GuildEmoji,
	Message, MessageComponentInteraction, TextChannel
} from "discord.js";

import { EmbedCorrect, ErrorEmbed } from "@modules/discord/structure/extends/embeds.extend";
import { Precommand } from "@typings/modules/discord";

// Dummy logger para evitar error de símbolo no encontrado
function logWithLabel(label: string, message: string) {
  console.log(`[${label}] ${message}`);
}

const emojisCommand: Precommand = {
  name: "emoji",
  description: "Comprehensive emoji management system for your server",
  aliases: ["emojis", "emojiinfo", "emoji-info", "emoji-control"],
  nsfw: false,
  owner: false,
  examples: [
    "emoji add <emoji> [name]",
    "emoji info <emoji>",
    "emoji jumbo <emoji>",
    "emoji list [page]",
    "emoji delete <emoji>",
    "emoji rename <emoji> <new_name>",
  ],
  botpermissions: ["ManageEmojisAndStickers", "AttachFiles", "UseExternalEmojis"],
  subcommands: [
    "emoji add <emoji> [name]",
    "emoji info <emoji>",
    "emoji jumbo <emoji>",
    "emoji list [page]",
    "emoji delete <emoji>",
    "emoji rename <emoji> <new_name>",
  ],
  permissions: ["ManageEmojisAndStickers"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const subcommand = args[0]?.toLowerCase() || "help";

    switch (subcommand) {
      case "add":
        await handleEmojiAdd(message, args.slice(1), prefix);
        break;
      case "info":
        await handleEmojiInfo(message, args.slice(1), prefix);
        break;
      case "jumbo":
        await handleEmojiJumbo(message, args.slice(1), prefix);
        break;
      case "list":
        await handleEmojiList(client, message, args.slice(1));
        break;
      case "delete":
      case "remove":
        await handleEmojiDelete(message, args.slice(1));
        break;
      case "rename":
        await handleEmojiRename(message, args.slice(1));
        break;
      default:
        await showEmojiHelp(message, prefix);
        break;
    }
  },
};

/**
 * Handles adding an emoji to the server
 */
async function handleEmojiAdd(message: Message, args: string[], prefix: string) {
  if (
    !message.guild ||
    !message.channel ||
    message.author.bot ||
    message.channel.type !== ChannelType.GuildText
  )
    return;
  const emojiInput = args[0];
  const customName = args[1]; // Optional custom name

  if (!emojiInput) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Missing Emoji")
          .setDescription(
            `Please provide an emoji to add.\nExample: \`${prefix}emoji add :thumbsup:\``,
          ),
      ],
    });
  }

  // Regex to match custom emojis
  const emojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi;
  const emojiMatch = emojiInput.match(emojiRegex);

  if (!emojiMatch) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Emoji")
          .setDescription("Please provide a valid custom emoji.")
          .addFields(
            {
              name: "Correct Format",
              value: "`<:name:123456789012345678>` or `:name:`",
              inline: true,
            },
            { name: "Example", value: `\`${prefix}emoji add :thumbsup:\``, inline: true },
          ),
      ],
    });
  }

  const [fullMatch] = emojiMatch;
  const isAnimated = fullMatch.startsWith("<a:");
  const emojiName = fullMatch.split(":")[1];
  const emojiId = fullMatch.split(":")[2].replace(">", "");
  const finalName = customName || emojiName;
  const extension = isAnimated ? "gif" : "png";
  const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

  // Check if emoji already exists
  const existingEmoji = message.guild.emojis.cache.find((e: GuildEmoji) => e.name === finalName);
  if (existingEmoji) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Emoji Exists")
          .setDescription(`An emoji with the name \`${finalName}\` already exists.`)
          .addFields(
            { name: "Existing Emoji", value: existingEmoji.toString(), inline: true },
            {
              name: "Created At",
              value: `<t:${Math.floor(existingEmoji.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
          ),
      ],
    });
  }

  // Check server emoji slots
  const emojiSlots =
    message.guild.premiumTier === 0 // GuildPremiumTier.None
      ? 50
      : message.guild.premiumTier === 1 // GuildPremiumTier.Tier1
        ? 100
        : message.guild.premiumTier === 2 // GuildPremiumTier.Tier2
          ? 150
          : 250;

  if (message.guild.emojis.cache.size >= emojiSlots) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Emoji Limit Reached")
          .setDescription(`This server has reached its emoji limit (${emojiSlots}).`)
          .addFields({
            name: "Possible Solutions",
            value: "• Delete unused emojis\n• Upgrade server boost level",
          }),
      ],
    });
  }

  // Create confirmation embed
  const confirmationEmbed = new EmbedBuilder()
    .setTitle("Confirm Emoji Addition")
    .setColor("Yellow")
    .setDescription(`You are about to add this emoji to the server`)
    .addFields(
      { name: "Name", value: finalName, inline: true },
      { name: "Type", value: isAnimated ? "Animated" : "Static", inline: true },
      { name: "Preview", value: `[View Image](${emojiUrl})`, inline: true },
    )
    .setThumbnail(emojiUrl);

  const confirmationMessage = await message.channel.send({
    embeds: [confirmationEmbed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("emoji-add-confirm")
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("emoji-add-cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger),
      ),
    ],
  });

  const collector = confirmationMessage.createMessageComponentCollector({
    filter: (i: MessageComponentInteraction) => i.user.id === message.author.id,
    time: 60000,
  });

  collector.on("collect", async (interaction: MessageComponentInteraction) => {
    if (!message.guild) return;

    if (interaction.customId === "emoji-add-confirm") {
      try {
        const createdEmoji = await message.guild?.emojis.create({
          attachment: emojiUrl,
          name: finalName,
        });

        await interaction.update({
          embeds: [
            new EmbedCorrect()
              .setTitle("Emoji Added Successfully")
              .setDescription(`The emoji has been added to the server!`)
              .addFields(
                { name: "Name", value: createdEmoji.name ?? "Unknown", inline: true },
                { name: "ID", value: createdEmoji.id, inline: true },
                { name: "Usage", value: `\`${createdEmoji.toString()}\``, inline: true },
              )
              .setThumbnail(createdEmoji.url),
          ],
          components: [],
        });
      } catch (error) {
        logWithLabel("error", `Emoji add error: ${error}`);
        await interaction.update({
          embeds: [
            new ErrorEmbed()
              .setTitle("Failed to Add Emoji")
              .setDescription("An error occurred while adding the emoji."),
          ],
          components: [],
        });
      }
    } else if (interaction.customId === "emoji-add-cancel") {
      await interaction.update({
        embeds: [confirmationEmbed.setTitle("Emoji Addition Cancelled").setColor("Red")],
        components: [],
      });
    }
  });

  collector.on("end", () => {
    confirmationMessage.edit({ components: [] }).catch(() => {});
  });

  return;
}

/**
 * Shows detailed information about an emoji
 */
async function handleEmojiInfo(message: Message, args: string[], prefix: string) {
  const emojiInput = args[0];

  if (!emojiInput) {
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Missing Emoji")
          .setDescription(
            `Please provide an emoji to inspect.\nExample: \`${prefix}emoji info :thumbsup:\``,
          ),
      ],
    });
  }

  // Check if it's a custom emoji
  const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi;
  const customEmojiMatch = emojiInput.match(customEmojiRegex);

  // Check if it's a default emoji
  const defaultEmojiRegex = /[\p{Emoji}]/gu;
  const isDefaultEmoji = defaultEmojiRegex.test(emojiInput);

  if (!customEmojiMatch && !isDefaultEmoji) {
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Emoji")
          .setDescription("Please provide a valid emoji (custom or default)."),
      ],
    });
  }

  if (customEmojiMatch) {
    const [fullMatch] = customEmojiMatch;
    const isAnimated = fullMatch.startsWith("<a:");
    const emojiName = fullMatch.split(":")[1];
    const emojiId = fullMatch.split(":")[2].replace(">", "");
    const extension = isAnimated ? "gif" : "png";
    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
    const isInServer = message.guild?.emojis.cache.has(emojiId);

    // Calculate creation date from Snowflake ID
    const timestamp = parseInt(emojiId) / 4194304 + 1420070400000;
    const createdAt = new Date(timestamp);

    const infoEmbed = new EmbedBuilder()
      .setTitle(`Emoji Information: ${emojiName}`)
      .setColor("Blue")
      .setThumbnail(emojiUrl)
      .addFields(
        { name: "Name", value: `\`${emojiName}\``, inline: true },
        { name: "ID", value: `\`${emojiId}\``, inline: true },
        { name: "Type", value: isAnimated ? "Animated" : "Static", inline: true },
        { name: "In This Server", value: isInServer ? "✅ Yes" : "❌ No", inline: true },
        {
          name: "Created At",
          value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`,
          inline: true,
        },
        { name: "URL", value: `[Click Here](${emojiUrl})`, inline: true },
        { name: "Identifier", value: `\`${fullMatch}\`` },
      );

    if (isInServer) {
      const emoji = message.guild?.emojis.cache.get(emojiId) as GuildEmoji;
      infoEmbed.addFields(
        { name: "Managed", value: emoji?.managed ? "✅ Yes" : "❌ No", inline: true },
        { name: "Available", value: emoji?.available ? "✅ Yes" : "❌ No", inline: true },
        {
          name: "Requires Colons",
          value: emoji?.requiresColons ? "✅ Yes" : "❌ No",
          inline: true,
        },
      );
    }

    await (message.channel as TextChannel).send({ embeds: [infoEmbed] });
  } else {
    // Default emoji handling
    const emojiCodePoints = Array.from(emojiInput)
      .map((char) => char.codePointAt(0)?.toString(16))
      .filter(Boolean)
      .join("-");

    const emojiUrl = `https://twemoji.maxcdn.com/v/latest/72x72/${emojiCodePoints}.png`;

    const infoEmbed = new EmbedBuilder()
      .setTitle("Default Emoji Information")
      .setColor("Blue")
      .setThumbnail(emojiUrl)
      .addFields(
        { name: "Emoji", value: emojiInput, inline: true },
        { name: "Unicode", value: `\`\\u{${emojiCodePoints}}\``, inline: true },
        { name: "URL", value: `[Twemoji Image](${emojiUrl})`, inline: true },
      );

    await (message.channel as TextChannel).send({ embeds: [infoEmbed] });
  }

  return;
}

/**
 * Creates a jumbo (large) version of an emoji
 */
async function handleEmojiJumbo(message: Message, args: string[], prefix: string) {
  if (
    !message.guild ||
    !message.channel ||
    message.author.bot ||
    message.channel.type !== ChannelType.GuildText
  )
    return;
  const emojiInput = args[0];

  if (!emojiInput) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Missing Emoji")
          .setDescription(
            `Please provide an emoji to enlarge.\nExample: \`${prefix}emoji jumbo :thumbsup:\``,
          ),
      ],
    });
  }

  const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi;
  const customEmojiMatch = emojiInput.match(customEmojiRegex);

  const defaultEmojiRegex = /[\p{Emoji}]/gu;
  const isDefaultEmoji = defaultEmojiRegex.test(emojiInput);

  if (!customEmojiMatch && !isDefaultEmoji) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Emoji")
          .setDescription("Please provide a valid emoji (custom or default)."),
      ],
    });
  }

  if (customEmojiMatch) {
    const [fullMatch] = customEmojiMatch;
    const emojiName = fullMatch.split(":")[1];
    const emojiId = fullMatch.split(":")[2].replace(">", "");
    const isAnimated = fullMatch.startsWith("<a:");
    const extension = isAnimated ? "gif" : "png";
    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

    const jumboEmbed = new EmbedBuilder()
      .setTitle(`Jumbo Emoji: ${emojiName}`)
      .setImage(emojiUrl)
      .setColor("Random");

    await message.channel.send({ embeds: [jumboEmbed] });
  } else {
    // Default emoji jumbo
    const emojiCodePoints = Array.from(emojiInput)
      .map((char) => char.codePointAt(0)?.toString(16))
      .filter(Boolean)
      .join("-");

    const emojiUrl = `https://twemoji.maxcdn.com/v/latest/72x72/${emojiCodePoints}.png`;

    const jumboEmbed = new EmbedBuilder()
      .setTitle("Jumbo Emoji")
      .setImage(emojiUrl.replace("72x72", "512x512")) // Get larger version
      .setColor("Random");

    await message.channel.send({ embeds: [jumboEmbed] });
  }

  return;
}

/**
 * Lists server emojis with pagination
 */
async function handleEmojiList(client: any, message: any, args: string[]) {
  const page = parseInt(args[0]) || 1;
  const perPage = 10;
  const emojis: Collection<string, GuildEmoji> = message.guild.emojis.cache;
  const totalPages = Math.ceil(emojis.size / perPage);

  if (emojis.size === 0) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("No Emojis Found")
          .setDescription("This server doesn't have any custom emojis."),
      ],
    });
  }

  if (page < 1 || page > totalPages) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Page")
          .setDescription(`Please select a page between 1 and ${totalPages}`),
      ],
    });
  }

  const emojiList = Array.from(emojis.values())
    .slice((page - 1) * perPage, page * perPage)
    .map((emoji: GuildEmoji, index: number) => {
      return `**${(page - 1) * perPage + index + 1}.** ${emoji.toString()} \`${emoji.name}\` - ID: \`${emoji.id}\``;
    });

  const listEmbed = new EmbedBuilder()
    .setTitle(`Server Emojis (Page ${page}/${totalPages})`)
    .setDescription(emojiList.join("\n"))
    .setColor("Blue")
    .setFooter({
      text: `Total emojis: ${emojis.size} • Animated: ${emojis.filter((e: GuildEmoji) => e.animated).size}`,
    });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`emoji-list-prev-${page}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`emoji-list-next-${page}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages),
    new ButtonBuilder()
      .setCustomId("emoji-list-close")
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger),
  );

  const listMessage = await message.channel.send({
    embeds: [listEmbed],
    components: [row],
  });

  const collector = listMessage.createMessageComponentCollector({
    filter: (i: MessageComponentInteraction) => i.user.id === message.author.id,
    time: 60000,
  });

  collector.on("collect", async (interaction: MessageComponentInteraction) => {
    if (interaction.customId === "emoji-list-close") {
      await interaction.update({ components: [] });
      return;
    }

    const newPage = interaction.customId.includes("next") ? page + 1 : page - 1;
    await interaction.deferUpdate();
    await handleEmojiList(client, message, [newPage.toString()]);
    await listMessage.delete().catch(() => {});
  });

  collector.on("end", () => {
    listMessage.edit({ components: [] }).catch(() => {});
  });
}

/**
 * Handles deleting an emoji from the server
 */
async function handleEmojiDelete(message: Message, args: string[]) {
  if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
  const emojiInput = args.join(" ");

  if (!emojiInput) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Missing Emoji")
          .setDescription("Please provide an emoji to delete (name, ID, or mention)."),
      ],
    });
  }

  // Try to find emoji by ID, name, or mention
  let emoji = message.guild.emojis.cache.get(emojiInput) as GuildEmoji | undefined;
  if (!emoji) {
    emoji = message.guild.emojis.cache.find(
      (e: GuildEmoji) =>
        e.name?.toLowerCase() === emojiInput.toLowerCase() || e.toString() === emojiInput,
    );
  }

  if (!emoji) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Emoji Not Found")
          .setDescription("Couldn't find that emoji in this server."),
      ],
    });
  }

  // Create confirmation embed
  const confirmationEmbed = new EmbedBuilder()
    .setTitle("Confirm Emoji Deletion")
    .setColor("Red")
    .setDescription(`You are about to delete the emoji **${emoji.name}**`)
    .addFields(
      { name: "Emoji", value: emoji.toString(), inline: true },
      { name: "ID", value: emoji.id, inline: true },
      {
        name: "Created At",
        value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    )
    .setThumbnail(emoji.url);

  const confirmationMessage = await message.channel.send({
    embeds: [confirmationEmbed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("emoji-delete-confirm")
          .setLabel("Delete")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("emoji-delete-cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  });

  const collector = confirmationMessage.createMessageComponentCollector({
    filter: (i: MessageComponentInteraction) => i.user.id === message.author.id,
    time: 60000,
  });

  collector.on("collect", async (interaction: MessageComponentInteraction) => {
    if (interaction.customId === "emoji-delete-confirm") {
      try {
        const deletedName = emoji.name;
        await emoji.delete();

        await interaction.update({
          embeds: [
            new EmbedCorrect()
              .setTitle("Emoji Deleted")
              .setDescription(`The emoji \`${deletedName}\` has been deleted.`)
              .setColor("Green"),
          ],
          components: [],
        });
      } catch (error) {
        logWithLabel("error", `Emoji delete error: ${error}`);
        await interaction.update({
          embeds: [
            new ErrorEmbed()
              .setTitle("Deletion Failed")
              .setDescription("An error occurred while deleting the emoji."),
          ],
          components: [],
        });
      }
    } else if (interaction.customId === "emoji-delete-cancel") {
      await interaction.update({
        embeds: [
          confirmationEmbed
            .setTitle("Deletion Cancelled")
            .setDescription("The emoji was not deleted.")
            .setColor("Yellow"),
        ],
        components: [],
      });
    }
  });

  collector.on("end", () => {
    confirmationMessage.edit({ components: [] }).catch(() => {});
  });

  return;
}

/**
 * Handles renaming an emoji
 */
async function handleEmojiRename(message: Message, args: string[]) {
  if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
  const emojiInput = args[0];
  const newName = args[1];

  if (!emojiInput || !newName) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Missing Arguments")
          .setDescription(
            "Please provide an emoji and a new name.\nExample: `emoji rename :oldname: newname`",
          ),
      ],
    });
  }

  if (newName.length < 2 || newName.length > 32) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Name")
          .setDescription("Emoji names must be between 2 and 32 characters long."),
      ],
    });
  }

  // Try to find emoji by ID, name, or mention
  let emoji = message.guild.emojis.cache.get(emojiInput) as GuildEmoji | undefined;
  if (!emoji) {
    emoji = message.guild.emojis.cache.find(
      (e: GuildEmoji) =>
        e.name?.toLowerCase() === emojiInput.toLowerCase() || e.toString() === emojiInput,
    );
  }

  if (!emoji) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Emoji Not Found")
          .setDescription("Couldn't find that emoji in this server."),
      ],
    });
  }

  // Check if new name already exists
  if (
    message.guild.emojis.cache.some(
      (e: GuildEmoji) => e.name?.toLowerCase() === newName.toLowerCase(),
    )
  ) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Name Exists")
          .setDescription(`An emoji with the name \`${newName}\` already exists.`),
      ],
    });
  }

  try {
    const oldName = emoji.name;
    await emoji.edit({ name: newName });

    await message.channel.send({
      embeds: [
        new EmbedCorrect()
          .setTitle("Emoji Renamed")
          .setDescription(`Successfully renamed the emoji.`)
          .addFields(
            { name: "Old Name", value: oldName ?? "Unknown", inline: true },
            { name: "New Name", value: newName, inline: true },
            { name: "Emoji", value: emoji.toString(), inline: true },
          )
          .setThumbnail(emoji.url),
      ],
    });
  } catch (error) {
    logWithLabel("error", `Emoji rename error: ${error}`);
    message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Rename Failed")
          .setDescription("An error occurred while renaming the emoji."),
      ],
    });
  }

  return;
}

/**
 * Shows help information for the emoji command
 */
async function showEmojiHelp(message: Message, prefix: string) {
  if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
  const helpEmbed = new EmbedBuilder()
    .setTitle("🎭 Emoji Command Help")
    .setColor("Blue")
    .setDescription("Comprehensive emoji management system for your server")
    .addFields(
      {
        name: "Add Emoji",
        value: `\`${prefix}emoji add <emoji> [name]\`\nAdds a custom emoji to the server. You can optionally specify a custom name.`,
      },
      {
        name: "Emoji Info",
        value: `\`${prefix}emoji info <emoji>\`\nShows detailed information about an emoji (works for both custom and default emojis).`,
      },
      {
        name: "Jumbo Emoji",
        value: `\`${prefix}emoji jumbo <emoji>\`\nDisplays a large version of the emoji.`,
      },
      {
        name: "List Emojis",
        value: `\`${prefix}emoji list [page]\`\nLists all server emojis with pagination.`,
      },
      {
        name: "Delete Emoji",
        value: `\`${prefix}emoji delete <emoji>\`\nRemoves an emoji from the server.`,
      },
      {
        name: "Rename Emoji",
        value: `\`${prefix}emoji rename <emoji> <new_name>\`\nChanges the name of an existing emoji.`,
      },
    )
    .setFooter({ text: `Required permissions: Manage Emojis and Stickers` });

  await message.channel.send({ embeds: [helpEmbed] });
}

export = emojisCommand;
