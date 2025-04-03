import { AutocompleteInteraction } from "discord.js";

import { MainDiscord } from "@/modules/discord/infrastructure/client";

export interface CommandOptions {
  cooldown?: number; // Tiempo de cooldown en segundos
  owner?: boolean;
  autocomplete?: (
    client: MainDiscord,
    interaction: AutocompleteInteraction,
    configuration: typeof config,
  ) => void;
}
