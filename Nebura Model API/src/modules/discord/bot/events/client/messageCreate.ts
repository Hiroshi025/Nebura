import { client } from "@/main";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { ErrorEmbed } from "@/structure/extenders/discord/embeds.extender";
import { Precommand } from "@/typings/discord";

import { Event } from "../../../structure/utils/builders";

export default new Event("messageCreate", async (message) => {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;
  if (!message.content.startsWith(config.modules.discord.prefix)) return;
  const language: string = message.guild.preferredLocale;

  const args: string[] = message.content
    .slice(config.modules.discord.prefix.length)
    .trim()
    .split(/\s+/);

  const cmd: string = args.shift()?.toLowerCase() ?? "";
  if (!cmd) return;

  const command: Precommand | undefined =
    (client.precommands.get(cmd) as Precommand) ||
    (client.precommands.find((c) => (c as Precommand)?.aliases?.includes(cmd)) as Precommand);

  if (!command) return;

  try {
    await command.execute(client, message, args, config.modules.discord.prefix, language, config);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace available";
    if (errorStack) logWithLabel("error", `Stack trace: ${errorStack}`);

    const errorEmbed = new ErrorEmbed()
      .setError(true)
      .setTitle("Command Execution Error")
      .setErrorFormat(errorMessage, errorStack);

    await message.channel.send({ embeds: [errorEmbed] });
  }
});
