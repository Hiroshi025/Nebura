import { EmbedBuilder, version as discordVersion } from "discord.js";

export class EmbedExtender extends EmbedBuilder {
  constructor() {
    super();

    const responseTime = Date.now() - new Date().getTime();
    this.setFooter({
      text: `Response: ${responseTime}ms | Discord.js: ${discordVersion} | Node.js: ${process.versions.node}`,
    });
    this.setTimestamp();
  }

  public setError(status: boolean) {
    this.setAuthor({
      name: status ? `Application Sucess ${new Date()}` : `Application Error ${new Date()}`,
    });
    this.setColor(status ? 0x00ff00 : 0xff0000);
  }

  public configureEmbed(status: boolean, message: string) {
    this.setError(status);
    this.setDescription(message);
  }
}
