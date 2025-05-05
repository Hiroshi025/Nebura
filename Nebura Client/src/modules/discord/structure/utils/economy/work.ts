import {
	ActionRowBuilder, ChatInputCommandInteraction, StringSelectMenuBuilder,
	StringSelectMenuInteraction
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

import { MyClient } from "../../../client";
import { fetchBalance, toFixedNumber } from "../functions";

type Job = {
  name: string;
  emoji: string;
  dailyPay: number;
  minDays: number;
};

const JOBS: Job[] = [
  { name: "Software Engineer", emoji: "💻", dailyPay: 500, minDays: 7 },
  { name: "Doctor", emoji: "🩺", dailyPay: 600, minDays: 10 },
  { name: "Teacher", emoji: "📚", dailyPay: 300, minDays: 5 },
  { name: "Chef", emoji: "🍳", dailyPay: 400, minDays: 6 },
  { name: "Artist", emoji: "🎨", dailyPay: 350, minDays: 4 },
  { name: "Police Officer", emoji: "👮", dailyPay: 450, minDays: 8 },
  { name: "Firefighter", emoji: "🚒", dailyPay: 500, minDays: 9 },
  { name: "Pilot", emoji: "✈️", dailyPay: 700, minDays: 12 },
  { name: "Farmer", emoji: "🌾", dailyPay: 250, minDays: 3 },
  { name: "Mechanic", emoji: "🔧", dailyPay: 400, minDays: 6 },
  { name: "Scientist", emoji: "🔬", dailyPay: 650, minDays: 11 },
  { name: "Musician", emoji: "🎵", dailyPay: 300, minDays: 5 },
  { name: "Athlete", emoji: "🏅", dailyPay: 550, minDays: 8 },
  { name: "Writer", emoji: "✍️", dailyPay: 350, minDays: 4 },
  { name: "Photographer", emoji: "📸", dailyPay: 300, minDays: 5 },
];

export async function WorkCommand(interaction: ChatInputCommandInteraction, _client: MyClient) {
  if (!interaction.guild || !interaction.channel) return;

  const user = interaction.user;
  const userWork = await main.prisma.userEconomy.findUnique({
    where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
    select: { job: true, jobStartDate: true, lastWorkDate: true, jobCooldown: true },
  });

  const now = new Date();

  // Check if the user has a job
  if (userWork?.job) {
    const lastWorkDate = userWork.lastWorkDate ? new Date(userWork.lastWorkDate) : null;
    const hoursSinceLastWork = lastWorkDate
      ? Math.floor((now.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60))
      : 24;

    if (hoursSinceLastWork < 24) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            `You need to wait **${24 - hoursSinceLastWork} hours** to claim your daily pay.`,
          ),
        ],
        ephemeral: true,
      });
    }

    // 30% chance of being fired
    if (Math.random() < 0.3) {
      await main.prisma.userEconomy.update({
        where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
        data: { job: null, jobStartDate: null, lastWorkDate: null, jobCooldown: now },
      });

      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setDescription(
              `😢 You have been fired from your job as **${userWork.job}**. You must wait **48 hours** before selecting a new job.`,
            )
            .setColor("Red"),
        ],
        ephemeral: true,
      });
    }

    // Pay the user
    const job = JOBS.find((j) => j.name === userWork.job);
    if (!job) {
      return interaction.reply({
        embeds: [new ErrorEmbed().setDescription("Your job data is corrupted.")],
        ephemeral: true,
      });
    }

    const userBalance = await fetchBalance(user.id, interaction.guild.id);
    const newBalance = await toFixedNumber(userBalance.balance + job.dailyPay);

    await main.prisma.userEconomy.update({
      where: { userId_guildId: `${userBalance.id}-${interaction.guild.id}` },
      data: { balance: newBalance, lastWorkDate: now },
    });

    return interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setDescription(
            `💼 You worked as a **${job.name}** and earned **$${job.dailyPay}**! Your new balance is **$${newBalance}**.`,
          )
          .setColor("Green"),
      ],
      ephemeral: true,
    });
  }

  // Check if the user is on cooldown
  const cooldown = userWork?.jobCooldown ? new Date(userWork.jobCooldown) : null;
  const hoursSinceCooldown = cooldown
    ? Math.floor((now.getTime() - cooldown.getTime()) / (1000 * 60 * 60))
    : 48;

  if (cooldown && hoursSinceCooldown < 48) {
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          `You must wait **${48 - hoursSinceCooldown} hours** before selecting a new job.`,
        ),
      ],
      ephemeral: true,
    });
  }

  // Job selection menu
  const jobSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("job_select")
    .setPlaceholder("Select a job")
    .addOptions(
      JOBS.map((job) => ({
        label: `${job.emoji} ${job.name}`,
        description: `Daily Pay: $${job.dailyPay} | Min Days: ${job.minDays}`,
        value: job.name,
      })),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(jobSelectMenu);

  const jobMessage = await interaction.reply({
    content: "💼 Select a job from the list below:",
    components: [row],
    ephemeral: true,
  });

  try {
    const jobResponse = (await jobMessage.awaitMessageComponent({
      filter: (i) => i.user.id === user.id && i.customId === "job_select",
      time: 30000,
    })) as StringSelectMenuInteraction;

    const selectedJob = JOBS.find((job) => job.name === jobResponse.values[0]);
    if (!selectedJob) {
      return jobResponse.update({
        content: "❌ Invalid job selection.",
        components: [],
      });
    }

    await main.prisma.userEconomy.update({
      where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
      data: { job: selectedJob.name, jobStartDate: now, lastWorkDate: now },
    });

    return jobResponse.update({
      content: `✅ You have selected the job **${selectedJob.emoji} ${selectedJob.name}**! You must work for at least **${selectedJob.minDays} days** before changing jobs.`,
      components: [],
    });
  } catch {
    return interaction.editReply({
      content: "❌ You did not select a job in time.",
      components: [],
    });
  }
}
