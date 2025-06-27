import { exec } from "child_process";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { MxRecord, SoaRecord, SrvRecord } from "dns";
import { lookup } from "dns/promises";
import { ping } from "tcp-ping";
import { promisify } from "util";

import emojis from "@config/json/emojis.json";
import { Precommand } from "@typings/modules/discord";
import { ErrorEmbed } from "@utils/extenders/embeds.extend";

const execPromise = promisify(exec);

const dnsCommand: Precommand = {
  name: "dns",
  description: "Perform DNS lookups and website status checks",
  examples: ["dns [website]", "dns lookup google.com"],
  nsfw: false,
  owner: false,
  cooldown: 10,
  aliases: ["dnslookup", "websiteinfo", "checkwebsite"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message, args, prefix) {
    try {
      if (!message.guild) return;

      // If no arguments provided, show the main menu
      if (!args.length) {
        return showMainMenu(message, prefix);
      }

      // If domain provided directly, show quick info
      const domain = args[0].replace(/^https?:\/\//, "").split("/")[0];
      return showQuickLookup(message, domain);
    } catch (e: any) {
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setFooter({
              text: `Requested by: ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              [
                `${emojis.error} An error occurred while executing this command!`,
                `Please try again later or join our support server for help!`,
              ].join("\n"),
            )
            .setErrorFormat(e.stack),
        ],
      });
    }
  },
};

// Show main menu with options
async function showMainMenu(message: any, prefix: string) {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("DNS & Website Analysis Tool")
    .setDescription("Please select an option from the menu below to analyze a website")
    .addFields(
      { name: "Quick Lookup", value: `\`${prefix}dns [domain]\``, inline: true },
      { name: "Full Analysis", value: "Use the button below", inline: true },
      { name: "Available Checks", value: "DNS Records, Ping, Traceroute, SSL Info, HTTP Status" },
    )
    .setFooter({ text: "Powered by Node.js DNS module" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("full_analysis").setLabel("Start Full Analysis").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dns_examples").setLabel("Show Examples").setStyle(ButtonStyle.Secondary),
  );

  const msg = await message.reply({
    embeds: [embed],
    components: [row],
  });

  // Collector for button interactions
  const collector = msg.createMessageComponentCollector({ time: 60000 });

  collector.on("collect", async (interaction: any) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "full_analysis") {
      await interaction.showModal(
        new ModalBuilder()
          .setCustomId("dns_modal")
          .setTitle("Website Analysis")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("website_url")
                .setLabel("Enter website URL or IP")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder("example.com"),
            ),
          ),
      );
    } else if (interaction.customId === "dns_examples") {
      const examplesEmbed = new EmbedBuilder()
        .setColor("#4CAF50")
        .setTitle("DNS Lookup Examples")
        .setDescription("Here are some usage examples:")
        .addFields(
          { name: "Quick DNS Lookup", value: `\`${prefix}dns google.com\`` },
          { name: "Check All Records", value: `\`${prefix}dns records example.com\`` },
          { name: "Ping Test", value: `\`${prefix}dns ping github.com\`` },
          { name: "HTTP Status", value: `\`${prefix}dns status discord.com\`` },
        );

      await interaction.reply({ embeds: [examplesEmbed], ephemeral: true });
    }
  });

  collector.on("end", () => {
    msg.edit({ components: [] }).catch(() => {});
  });
}

// Show quick lookup results
async function showQuickLookup(message: any, domain: string) {
  try {
    // Initial response with loading state
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`Analyzing ${domain}`)
      .setDescription("Gathering information...")
      .setFooter({ text: "This may take a few seconds" });

    const msg = await message.reply({ embeds: [loadingEmbed] });

    // Perform DNS lookups in parallel
    const { resolveMx, resolveTxt, resolveCname } = await import("dns/promises");
    const [aRecords, mxRecords, txtRecords, _cnameRecords, _pingResult] = await Promise.all([
      lookup(domain, 4).catch(() => ({ address: "Not found" })),
      resolveMx(domain).catch(() => []),
      resolveTxt(domain).catch(() => []),
      resolveCname(domain).catch(() => []),
      pingDomain(domain),
    ]);

    // Build results embed
    const resultEmbed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle(`DNS Results for ${domain}`)
      .addFields(
        { name: "IP Address (A Record)", value: aRecords.address || "Not found", inline: true },
        {
          name: "MX Records",
          value: mxRecords.length ? mxRecords.map((r: any) => r.exchange).join("\n") : "None",
          inline: false,
        },
        {
          name: "TXT Records",
          value: txtRecords.length
            ? txtRecords
                .map((arr: string[]) => arr.join(""))
                .join("\n")
                .slice(0, 1024)
            : "None",
          inline: false,
        },
      )
      .setFooter({
        text: `Requested by: ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      });

    // Create action buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dns_full_${domain}`).setLabel("Full Analysis").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dns_ping_${domain}`).setLabel("Detailed Ping").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`dns_records_${domain}`)
        .setLabel("All DNS Records")
        .setStyle(ButtonStyle.Secondary),
    );

    await msg.edit({ embeds: [resultEmbed], components: [row] });

    // Collector for button interactions
    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (interaction: any) => {
      if (!interaction.isButton()) return;

      const [action, targetDomain] = interaction.customId.split("_").slice(1);

      switch (action) {
        case "full":
          await showFullAnalysis(interaction, targetDomain);
          break;
        case "ping":
          await showDetailedPing(interaction, targetDomain);
          break;
        case "records":
          await showAllDNSRecords(interaction, targetDomain);
          break;
      }
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error Analyzing Domain")
      .setDescription(`Failed to analyze ${domain}. Please check the domain and try again.`)
      .setFooter({ text: `Error: ${error.message}` });

    message.reply({ embeds: [errorEmbed] });
  }
}

// Show full analysis with select menu
async function showFullAnalysis(interaction: any, domain: string) {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(`Full Analysis Options for ${domain}`)
    .setDescription("Select the type of analysis you want to perform");

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`dns_analysis_select_${domain}`)
    .setPlaceholder("Select analysis type")
    .addOptions(
      { label: "DNS Records", value: "dns_records", description: "View all DNS records" },
      { label: "Network Ping", value: "network_ping", description: "Detailed ping statistics" },
      { label: "Traceroute", value: "traceroute", description: "View network path to server" },
      { label: "HTTP Headers", value: "http_headers", description: "View website HTTP headers" },
      { label: "SSL Certificate", value: "ssl_cert", description: "View SSL certificate details" },
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });

  // Handle select menu interaction
  const collector = interaction.channel.createMessageComponentCollector({
    filter: (i: any) => i.customId === `dns_analysis_select_${domain}`,
    time: 60000,
  });

  collector.on("collect", async (menuInteraction: any) => {
    const analysisType = menuInteraction.values[0];

    switch (analysisType) {
      case "dns_records":
        await showAllDNSRecords(menuInteraction, domain);
        break;
      case "network_ping":
        await showDetailedPing(menuInteraction, domain);
        break;
      case "traceroute":
        await showTraceroute(menuInteraction, domain);
        break;
      case "http_headers":
        await showHTTPHeaders(menuInteraction, domain);
        break;
      case "ssl_cert":
        await showSSLCertificate(menuInteraction, domain);
        break;
    }
  });
}

// Show all DNS records
async function showAllDNSRecords(interaction: any, domain: string) {
  const recordTypes = ["A", "AAAA", "MX", "TXT", "CNAME", "NS", "SOA", "SRV"];

  try {
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`Fetching all DNS records for ${domain}`)
      .setDescription("This may take a moment...");

    await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

    const records: any = {};

    // Import DNS resolver functions
    const { resolve4, resolve6, resolveMx, resolveTxt, resolveCname, resolveNs, resolveSoa, resolveSrv } = await import(
      "dns/promises"
    );

    // Fetch all record types in parallel
    await Promise.all(
      recordTypes.map(async (type) => {
        try {
          let result: string[] | MxRecord[] | string[][] | SoaRecord[] | SrvRecord[];
          switch (type) {
            case "A":
              result = await resolve4(domain);
              break;
            case "AAAA":
              result = await resolve6(domain);
              break;
            case "MX":
              result = await resolveMx(domain);
              break;
            case "TXT":
              result = await resolveTxt(domain);
              break;
            case "CNAME":
              result = await resolveCname(domain);
              break;
            case "NS":
              result = await resolveNs(domain);
              break;
            case "SOA":
              result = [await resolveSoa(domain)];
              break;
            case "SRV":
              result = await resolveSrv(domain);
              break;
            default:
              result = [];
          }
          records[type] = Array.isArray(result) ? result : [result];
        } catch {
          records[type] = [];
        }
      }),
    );

    // Format results
    const fields = [];
    for (const [type, values] of Object.entries(records)) {
      if (Array.isArray(values) && values.length > 0) {
        let valueStr = "";

        if (type === "MX") {
          valueStr = (values as any[]).map((r: any) => `${r.exchange} (priority ${r.priority})`).join("\n");
        } else if (type === "SOA") {
          const soa = values[0] as any;
          valueStr = `Primary NS: ${soa.nsname}\nAdmin: ${soa.hostmaster}\nSerial: ${soa.serial}\nRefresh: ${soa.refresh}\nRetry: ${soa.retry}\nExpire: ${soa.expire}\nTTL: ${soa.minttl}`;
        } else if (type === "TXT") {
          valueStr = (values as string[][]).flat().join("\n");
        } else {
          valueStr = (values as any[]).map((r: any) => r.address || r.value || r).join("\n");
        }

        fields.push({
          name: type,
          value: valueStr.slice(0, 1024) || "None",
          inline: type !== "SOA" && type !== "TXT",
        });
      }
    }

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle(`All DNS Records for ${domain}`)
      .addFields(fields)
      .setTimestamp()
      .setFooter({ text: `Requested by: ${interaction.user.tag}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error Fetching DNS Records")
      .setDescription(`Failed to fetch DNS records for ${domain}`)
      .setFooter({ text: `Error: ${error.message}` });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Show detailed ping results
async function showDetailedPing(interaction: any, domain: string) {
  try {
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`Pinging ${domain}`)
      .setDescription("Measuring network latency...");

    await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

    const result = await pingDomain(domain, 5); // 5 pings for more accurate results

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle(`Ping Results for ${domain}`)
      .addFields(
        { name: "IP Address", value: result.address || "Unknown", inline: true },
        { name: "Min Latency", value: `${result.min} ms`, inline: true },
        { name: "Max Latency", value: `${result.max} ms`, inline: true },
        { name: "Average Latency", value: `${result.avg} ms`, inline: true },
        { name: "Packet Loss", value: `${result.packetLoss}%`, inline: true },
        { name: "Standard Deviation", value: `${result.stddev} ms`, inline: true },
      )
      .setFooter({ text: `Based on ${result.times.length} pings` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Ping Failed")
      .setDescription(`Could not ping ${domain}`)
      .setFooter({ text: `Error: ${error.message}` });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Show traceroute results
async function showTraceroute(interaction: any, domain: string) {
  try {
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`Tracing route to ${domain}`)
      .setDescription("This may take up to 30 seconds...");

    await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

    // Note: This uses the system's traceroute command
    const { stdout } = await execPromise(`traceroute ${domain}`);

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle(`Traceroute to ${domain}`)
      .setDescription(`\`\`\`\n${stdout.slice(0, 4000)}\n\`\`\``)
      .setFooter({ text: "Results from system traceroute command" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Traceroute Failed")
      .setDescription(`Could not trace route to ${domain}`)
      .setFooter({ text: `Error: ${error.message}` });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Show HTTP headers
async function showHTTPHeaders(interaction: any, domain: string) {
  try {
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`Fetching HTTP headers for ${domain}`)
      .setDescription("Connecting to server...");

    await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

    const { stdout } = await execPromise(`curl -I https://${domain}`);

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle(`HTTP Headers for ${domain}`)
      .setDescription(`\`\`\`\n${stdout.slice(0, 4000)}\n\`\`\``)
      .setFooter({ text: "Results from curl command" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Failed to Fetch Headers")
      .setDescription(`Could not retrieve HTTP headers for ${domain}`)
      .setFooter({ text: `Error: ${error.message}` });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Show SSL certificate info
async function showSSLCertificate(interaction: any, domain: string) {
  try {
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`Fetching SSL certificate for ${domain}`)
      .setDescription("Connecting to server...");

    await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

    const { stdout } = await execPromise(
      `openssl s_client -showcerts -connect ${domain}:443 </dev/null 2>/dev/null | openssl x509 -noout -text`,
    );

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle(`SSL Certificate for ${domain}`)
      .setDescription(`\`\`\`\n${stdout.slice(0, 4000)}\n\`\`\``)
      .setFooter({ text: "Results from openssl command" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Failed to Fetch SSL Certificate")
      .setDescription(`Could not retrieve SSL certificate for ${domain}`)
      .setFooter({ text: `Error: ${error.message}` });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Helper function to ping a domain
async function pingDomain(domain: string, count = 3): Promise<any> {
  return new Promise((resolve, reject) => {
    ping({ address: domain, attempts: count }, (err: any, result: { results: any[] }) => {
      if (err) return reject(err);

      const times = result.results.filter((r) => r.time !== undefined).map((r) => r.time!);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      // Calculate standard deviation
      const squareDiffs = times.map((time) => Math.pow(time - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / times.length;
      const stddev = Math.sqrt(avgSquareDiff);

      // Calculate packet loss
      const packetLoss = ((result.results.length - times.length) / result.results.length) * 100;

      resolve({
        address: result.results[0].addr || domain,
        min,
        max,
        avg,
        stddev,
        packetLoss,
        times,
      });
    });
  });
}

export = dnsCommand;
