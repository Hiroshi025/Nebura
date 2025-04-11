import { codeBlock, EmbedBuilder, version as discordVersion } from "discord.js";

import { client } from "@/main";

import { ProyectError } from "../errors.extender";

export class EmbedExtender extends EmbedBuilder {
  private _isError: boolean | null = null; // Propiedad para rastrear el estado de setError

  constructor() {
    super();

    const responseTime = Date.now() - new Date().getTime();
    this.setFooter({
      text: `Response: ${responseTime}ms | Discord.js: ${discordVersion} | Node.js: ${process.versions.node}`,
    });
    this.setTimestamp();
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  public setError(status: boolean) {
    this._isError = status; // Actualiza el estado de error
    const formattedDate = this.formatDate(new Date());
    this.setAuthor({
      name: status
        ? `Application Success - ${formattedDate}`
        : `Application Error - ${formattedDate}`,
    });
    this.setColor(status ? 0x00ff00 : 0xff0000);
    return this;
  }

  public setErrorFormat(message: string, details?: string) {
    if (this._isError === false)
      throw new ProyectError("The error format cannot be set if setError is false.");

    const fields = [
      {
        name: "Error Project Message",
        value: `\`\`\`json\n${codeBlock(message)}\n\`\`\``,
        inline: false,
      },
      details
        ? {
            name: "Additional Details",
            value: `\`\`\`json\n${codeBlock(details)}\n\`\`\``,
            inline: false,
          }
        : undefined,
    ].filter(
      (field): field is { name: string; value: string; inline: false } => field !== undefined,
    );

    this.setFields(...fields);
    return this;
  }
}

export class EmbedInfo extends EmbedBuilder {
  constructor() {
    const responseTime = Date.now() - new Date().getTime();
    super();
    this.setAuthor({
      name: `Application Nebura AI`,
      iconURL: client.user?.avatarURL({ forceStatic: true }) as string,
    });
    this.setFooter({
      text: `Response: ${responseTime}ms | Discord.js: ${discordVersion} | Node.js: ${process.versions.node}`,
    });
    this.setColor("Green");
    this.setTimestamp();
  }
}
