import { ChannelType } from "discord.js";

import {
	handleRepository, handleSearch, handleUser
} from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { Precommand } from "@typings/modules/discord";

const commandGithub: Precommand = {
  name: "github",
  description: "Search GitHub profiles and repositories",
  examples: [
    "github <username> - Search for a GitHub user",
    "github <username>/<repo> - Search for a specific repository",
    "github search <query> - Search for repositories",
  ],
  nsfw: false,
  owner: false,
  aliases: ["gh", "git"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    if (!args[0]) {
      return message.reply(
        "Please provide a GitHub username, repository (user/repo), or search query. Example: `github octocat` or `github octocat/Hello-World`",
      );
    }

    // Check if it's a repository (contains /)
    if (args[0].includes("/") && args.length === 1) {
      return await handleRepository(message, args[0]);
    }

    // Check if it's a search
    if (args[0].toLowerCase() === "search") {
      const query = args.slice(1).join(" ");
      return await handleSearch(message, query);
    }

    // Otherwise treat as username
    return await handleUser(message, args[0]);
  },
};

export = commandGithub;
