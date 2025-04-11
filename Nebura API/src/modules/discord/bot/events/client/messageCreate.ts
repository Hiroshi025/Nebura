import { EmbedExtender } from "@/infrastructure/extenders/discord/embeds.extender";
import { client } from "@/main";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { Precommand } from "@/typings/discord";

import { Event } from "../../../infrastructure/utils/builders";

export default new Event("messageCreate", async (message) => {
  // Initial validations
  if (!message.guild || !message.channel || message.author.bot) return;
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

    logWithLabel("error", `Error executing command "${cmd}": ${errorMessage}`);
    if (errorStack) logWithLabel("error", `Stack trace: ${errorStack}`);

    const errorEmbed = new EmbedExtender()
      .setError(true)
      .setTitle("Command Execution Error")
      .setDescription(
        "An unexpected error occurred while trying to execute the command. Please try again later.",
      )
      .setErrorFormat(errorMessage, errorStack);

    await message.reply({ embeds: [errorEmbed] });
  }
});
