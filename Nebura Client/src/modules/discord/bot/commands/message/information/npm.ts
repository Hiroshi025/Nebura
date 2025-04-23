import axios from "axios";
import { stripIndent } from "common-tags";
import { ChannelType, EmbedBuilder } from "discord.js";
import moment from "moment";

import { ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Precommand } from "@typings/modules/discord";
import { logWithLabel } from "@utils/functions/console";

const npmCommand: Precommand = {
  name: "npm",
  description: "NPM search package and get information",
  examples: ["npm <package name>"],
  nsfw: false,
  owner: false,
  permissions: ["SendMessages"],
  cooldown: 10,
  aliases: ["npm-search", "npm-package", "npm-info"],
  botpermissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    try {
      if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
        return;
      const pkg = args[0];
      if (!pkg)
        return message.reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(
                  message.guild.id,
                  "error",
                )} The \`package name\` is a required argument that is missing.`,
                `Usage: \`${prefix}npm <package name>\``,
              ].join("\n"),
            ),
          ],
        });

      const body = await axios.get(`https://registry.npmjs.com/${pkg}`).then((res) => {
        if (res.status === 404) throw "No results found.";
        return res.data;
      });

      const version = body.versions[body["dist-tags"].latest]; // Get the latest version of the package

      let deps = version.dependencies ? Object.keys(version.dependencies) : null;
      let deps_dev = version.devDependencies ? Object.keys(version.devDependencies) : null;
      let maintainers = body.maintainers.map((user: { name: unknown }) => user.name);

      if (maintainers.length > 10) {
        const len = maintainers.length - 10;
        maintainers = maintainers.slice(0, 10);
        maintainers.push(`...${len} more.`);
      }

      if (deps && deps.length > 10) {
        const len = deps.length - 10;
        deps = deps.slice(0, 10);
        deps.push(`...${len} more.`);
      }

      if (deps_dev && deps_dev.length > 10) {
        const len = deps_dev.length - 10;
        deps_dev = deps_dev.slice(0, 10);
        deps_dev.push(`...${len} more.`);
      }

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`NPM: ${pkg}`)
            .setColor("Aqua")
            .setFooter({
              text: `Requested by ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            })
            .setTimestamp()
            .setURL(`https://npmjs.com/package/${pkg}`)
            .setAuthor({
              name: "RECOURCE PACKAGE MANAGER",
              iconURL: "https://i.imgur.com/ErKf5Y0.png",
            })
            .setDescription(
              stripIndent`
              > ${
                body.description
                  ? body.description
                  : `${client.getEmoji(message.guild.id, "error")} No description provided.`
              }
              > **Version:** \`${body["dist-tags"].latest}\`\n
              **__Information Package__**
              > **Homepage:** ${body.homepage ? `[Click here](${body.homepage})` : "None"}
              > **Bugs:** ${body.bugs ? `[Click here](${body.bugs.url})` : "None"}
              > **Maintainers:**
              \`\`\`${maintainers.join("\n")}\`\`\`
              **__Properties Packages__**
              > **Version:** ${version.version}
              > **Package-Size:** ${version.dist.unpackedSize / 1000 / 1000} MB
              > **Package-File Count:** ${version.dist.fileCount}
              > **Author:** ${body.author ? body.author.name : "None"}
              **__Creation & Modification__**
              > **Created at:** <t:${Math.floor(
                new Date(body.time.created).getTime() / 1000,
              )}:R> | \`${moment(body.time.created).fromNow()}\`
              > **Modified at:** \`${new Date(
                body.time.modified,
              ).toDateString()}\` | \`${moment(body.time.modified).fromNow()}\`
              > **NPM-Link:** [Click here](https://npmjs.com/package/${pkg})
            `,
            )
            .setFields(
              {
                name: "**__Dependencies__**",
                value: `\`\`\`${deps ? deps.join("\n") : "None"}\`\`\``,
                inline: false,
              },
              {
                name: "**__Development Dependencies__**",
                value: `\`\`\`${deps_dev ? deps_dev.join("\n") : "None"}\`\`\``,
                inline: false,
              },
              {
                name: "__Commands & Scripts__",
                value: `\`\`\`npm install ${pkg}\`\`\``,
                inline: false,
              },
            ),
        ],
      });
    } catch (e) {
      logWithLabel("error", `The error has occurred: ${e}`);
      console.error(e);
    }

    return;
  },
};
export = npmCommand;
