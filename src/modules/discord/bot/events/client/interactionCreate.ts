

import { main } from "../../../../../main";
import { config } from "../../../../../shared/utils/config";
import { Event } from "../../../infrastructure/utils/builders";

export default new Event("interactionCreate", async (interaction) => {
  if (!interaction.guild || !interaction.channel || interaction.user.bot || !interaction.user) return;

  const { guild } = interaction;
  if (!guild) return;

  switch (true) {
    case interaction.isChatInputCommand(): {
      const client = main.discord;
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      command.run(client, interaction, config);
    }
    break;
    default: {
      return;
    }
  }
});
