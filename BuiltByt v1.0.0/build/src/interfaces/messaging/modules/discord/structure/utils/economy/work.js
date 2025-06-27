"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="2f5cf65e-9742-51c2-8963-30ec87926c65")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkCommand = WorkCommand;
exports.handleTaxButton = handleTaxButton;
exports.showAllJobs = showAllJobs;
exports.trainSkill = trainSkill;
exports.prestigeCareer = prestigeCareer;
exports.requestLoan = requestLoan;
exports.payLoan = payLoan;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
const functions_1 = require("../functions");
const JOBS = [
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
// Freelance jobs definition
const FREELANCE_JOBS = [
    { name: "Delivery", emoji: "🚚", dailyPay: 200 + Math.floor(Math.random() * 300), minDays: 1 },
    { name: "Dog Walker", emoji: "🐕", dailyPay: 100 + Math.floor(Math.random() * 200), minDays: 1 },
    { name: "Event Staff", emoji: "🎤", dailyPay: 150 + Math.floor(Math.random() * 250), minDays: 1 },
];
async function WorkCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const user = interaction.user;
    const userWork = await main_1.main.prisma.userEconomy.findUnique({
        where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
        select: { job: true, jobStartDate: true, lastWorkDate: true, jobCooldown: true },
    });
    const now = new Date();
    // Freelance and tax buttons
    const freelanceButton = new discord_js_1.ButtonBuilder()
        .setCustomId("freelance_work")
        .setLabel("🛠️ Freelance Work")
        .setStyle(discord_js_1.ButtonStyle.Secondary);
    const payTaxButton = new discord_js_1.ButtonBuilder()
        .setCustomId("pay_tax")
        .setLabel("💸 Pay Taxes/Expenses")
        .setStyle(discord_js_1.ButtonStyle.Danger);
    // Check if the user has a job
    if (userWork?.job) {
        const lastWorkDate = userWork.lastWorkDate ? new Date(userWork.lastWorkDate) : null;
        const hoursSinceLastWork = lastWorkDate
            ? Math.floor((now.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60))
            : 24;
        if (hoursSinceLastWork < 24) {
            return interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription(`You need to wait **${24 - hoursSinceLastWork} hours** to claim your daily pay.`),
                ],
                flags: "Ephemeral",
            });
        }
        // 30% chance of being fired
        if (Math.random() < 0.3) {
            await main_1.main.prisma.userEconomy.update({
                where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
                data: { job: null, jobStartDate: null, lastWorkDate: null, jobCooldown: now },
            });
            return interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setDescription(`😢 You have been fired from your job as **${userWork.job}**. You must wait **48 hours** before selecting a new job.`)
                        .setColor("Red"),
                ],
                flags: "Ephemeral",
            });
        }
        // Fetch extra fields for rank, skills, reputation
        const userEconomy = await main_1.main.prisma.userEconomy.findUnique({
            where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
            select: { jobRank: true, skills: true, reputation: true, prestige: true },
        });
        let jobRank = userEconomy?.jobRank ?? 1;
        let skills = userEconomy?.skills ?? {};
        let reputation = userEconomy?.reputation ?? 0;
        let prestige = userEconomy?.prestige ?? 0;
        // Promotion: every 10 days, increase rank (max 5)
        let promotionMsg = "";
        if (userWork.jobStartDate) {
            const daysWorked = Math.floor((now.getTime() - new Date(userWork.jobStartDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysWorked > 0 && daysWorked % 10 === 0 && jobRank < 5) {
                jobRank += 1;
                promotionMsg = `🚀 You have been promoted to rank ${jobRank}!`;
                await main_1.main.prisma.userEconomy.update({
                    where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
                    data: { jobRank },
                });
            }
        }
        // Reputation: +1 for working, -2 for penalty event
        let eventMsg = "";
        let bonus = 0;
        let penalty = 0;
        const randomEvent = Math.random();
        if (randomEvent < 0.1) {
            bonus = Math.floor(Math.random() * 200) + 50;
            eventMsg = `🎉 You received a bonus of **$${bonus}** for your outstanding performance!`;
            reputation += 1;
        }
        else if (randomEvent > 0.9) {
            penalty = Math.floor(Math.random() * 150) + 50;
            eventMsg = `😓 You had an unexpected expense of **$${penalty}** today.`;
            reputation -= 2;
        }
        else {
            reputation += 1;
        }
        await main_1.main.prisma.userEconomy.update({
            where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
            data: { reputation },
        });
        // Salary with rank, skills, prestige bonus
        const jobObj = JOBS.find((j) => j.name === userWork.job);
        const salary = calculateSalary(jobObj, jobRank, skills) + prestige * 100;
        const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guild.id);
        let newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + salary + bonus - penalty);
        await main_1.main.prisma.userEconomy.upsert({
            where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
            update: { balance: newBalance, lastWorkDate: now },
            create: {
                userId_guildId: `${user.id}-${interaction.guild.id}`,
                userId: user.id,
                guildId: interaction.guild.id,
                balance: newBalance,
                lastWorkDate: now,
                // ...otros campos requeridos por tu modelo
            },
        });
        return interaction.reply({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setDescription(`💼 You worked as a **${jobObj.name}** (Rank ${jobRank}) and earned **$${salary}**! Your new balance is **$${newBalance}**.\n${eventMsg}\n${promotionMsg}\n⭐ Reputation: ${reputation}`)
                    .setColor("Green"),
            ],
            components: [new discord_js_1.ActionRowBuilder().addComponents(freelanceButton, payTaxButton)],
            flags: "Ephemeral",
        });
    }
    // Check if the user is on cooldown
    const cooldown = userWork?.jobCooldown ? new Date(userWork.jobCooldown) : null;
    const hoursSinceCooldown = cooldown ? Math.floor((now.getTime() - cooldown.getTime()) / (1000 * 60 * 60)) : 48;
    if (cooldown && hoursSinceCooldown < 48) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription(`You must wait **${48 - hoursSinceCooldown} hours** before selecting a new job.`),
            ],
            flags: "Ephemeral",
        });
    }
    // Job selection menu
    const jobSelectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("job_select")
        .setPlaceholder("Select a job")
        .addOptions(JOBS.map((job) => ({
        label: `${job.emoji} ${job.name}`,
        description: `Daily Pay: $${job.dailyPay} | Min Days: ${job.minDays}`,
        value: job.name,
    })));
    const row = new discord_js_1.ActionRowBuilder().addComponents(jobSelectMenu);
    const freelanceRow = new discord_js_1.ActionRowBuilder().addComponents(freelanceButton);
    const jobMessage = await interaction.reply({
        content: "💼 Select a job from the list below or try a freelance job:",
        components: [row, freelanceRow],
        flags: "Ephemeral",
    });
    try {
        const jobResponse = (await jobMessage.awaitMessageComponent({
            filter: (i) => i.user.id === user.id,
            time: 30000,
        }));
        // Freelance job flow
        if (jobResponse.customId === "freelance_work") {
            const freelanceMenu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId("freelance_select")
                .setPlaceholder("Choose a freelance job")
                .addOptions(FREELANCE_JOBS.map((job) => ({
                label: `${job.emoji} ${job.name}`,
                description: `Pay: $${job.dailyPay}`,
                value: job.name,
            })));
            const freelanceMenuRow = new discord_js_1.ActionRowBuilder().addComponents(freelanceMenu);
            await jobResponse.update({
                content: "Select a freelance job:",
                components: [freelanceMenuRow],
            });
            const freelanceResponse = (await interaction.channel?.awaitMessageComponent({
                filter: (i) => i.user.id === user.id && i.customId === "freelance_select",
                time: 20000,
            }));
            const selectedFreelance = FREELANCE_JOBS.find((job) => job.name === freelanceResponse.values[0]);
            if (!selectedFreelance) {
                return freelanceResponse.update({
                    content: "❌ Invalid selection.",
                    components: [],
                });
            }
            // Immediate pay, no job record
            const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guild.id);
            const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + selectedFreelance.dailyPay);
            await main_1.main.prisma.userEconomy.update({
                where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
                data: { balance: newBalance },
            });
            return freelanceResponse.update({
                content: `✅ You completed the freelance job **${selectedFreelance.emoji} ${selectedFreelance.name}** and earned **$${selectedFreelance.dailyPay}**!`,
                components: [],
            });
        }
        // Normal job selection
        const selectedJob = JOBS.find((job) => job.name === jobResponse.values[0]);
        if (!selectedJob) {
            return jobResponse.update({
                content: "❌ Invalid job selection.",
                components: [],
            });
        }
        await main_1.main.prisma.userEconomy.update({
            where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
            data: { job: selectedJob.name, jobStartDate: now, lastWorkDate: now },
        });
        return jobResponse.update({
            content: `✅ You have selected the job **${selectedJob.emoji} ${selectedJob.name}**! You must work for at least **${selectedJob.minDays} days** before changing jobs.`,
            components: [],
        });
    }
    catch {
        return interaction.editReply({
            content: "❌ You did not select a job in time.",
            components: [],
        });
    }
}
// Taxes/expenses button handler
async function handleTaxButton(interaction) {
    const user = interaction.user;
    const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guildId);
    const taxAmount = Math.floor(userBalance.balance * 0.05) + 100; // 5% of balance + 100
    if (userBalance.balance < taxAmount) {
        return interaction.reply({
            embeds: [new embeds_extend_1.ErrorEmbed().setDescription("You do not have enough money to pay your taxes/expenses.")],
            flags: "Ephemeral",
        });
    }
    const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - taxAmount);
    await main_1.main.prisma.userEconomy.update({
        where: { userId_guildId: `${user.id}-${interaction.guildId}` },
        data: { balance: newBalance },
    });
    return interaction.reply({
        embeds: [
            new embeds_extend_1.EmbedCorrect()
                .setDescription(`💸 You paid **$${taxAmount}** in taxes/expenses. Your new balance is **$${newBalance}**.`)
                .setColor("Orange"),
        ],
        flags: "Ephemeral",
    });
}
/**
 * Shows all available jobs in a stylish embed.
 */
async function showAllJobs(interaction) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("💼 Available Jobs")
        .setColor("#00bfff")
        .setDescription("Explore all the jobs you can choose from! Each job has its own daily pay and minimum days required before you can switch.")
        .addFields(JOBS.map((job) => ({
        name: `${job.emoji} ${job.name}`,
        value: `**Daily Pay:** $${job.dailyPay}\n**Min Days:** ${job.minDays}`,
        inline: true,
    })))
        .setFooter({ text: "Choose wisely and climb your career ladder!" });
    await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
}
// Utility to calculate salary with rank and skills
function calculateSalary(job, jobRank, skills) {
    let base = job.dailyPay * (1 + 0.2 * (jobRank - 1));
    if (skills && skills[job.name]) {
        base += skills[job.name] * 50;
    }
    return Math.floor(base);
}
// Command: Train skill (point 2)
async function trainSkill(interaction) {
    if (!interaction.guild || !interaction.channel)
        return;
    const user = interaction.user;
    const userWork = await main_1.main.prisma.userEconomy.findUnique({
        where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
        select: { job: true, skills: true, balance: true },
    });
    if (!userWork?.job) {
        return interaction.reply({
            content: "❌ You must have a job to train a skill.",
            flags: "Ephemeral",
        });
    }
    const cost = 300;
    if ((userWork.balance ?? 0) < cost) {
        return interaction.reply({
            content: "❌ You do not have enough money to train.",
            flags: "Ephemeral",
        });
    }
    const skills = typeof userWork.skills === "object" && userWork.skills !== null ? userWork.skills : {};
    skills[userWork.job] = (skills[userWork.job] || 0) + 1;
    await main_1.main.prisma.userEconomy.update({
        where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
        data: { skills, balance: userWork.balance - cost },
    });
    return interaction.reply({
        content: `✅ You improved your **${userWork.job}** skill to level ${skills[userWork.job]}.`,
        flags: "Ephemeral",
    });
}
// Command: Prestige (point 5)
async function prestigeCareer(interaction) {
    if (!interaction.guild || !interaction.channel)
        return;
    const user = interaction.user;
    const userWork = await main_1.main.prisma.userEconomy.findUnique({
        where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
        select: { prestige: true, jobRank: true, balance: true },
    });
    if ((userWork?.jobRank ?? 1) < 5) {
        return interaction.reply({
            content: "❌ You must reach at least rank 5 to prestige.",
            flags: "Ephemeral",
        });
    }
    await main_1.main.prisma.userEconomy.update({
        where: { userId_guildId: `${user.id}-${interaction.guild.id}` },
        data: {
            prestige: (userWork?.prestige ?? 0) + 1,
            jobRank: 1,
            balance: (userWork?.balance ?? 0) + 1000,
            job: null,
            jobStartDate: null,
            lastWorkDate: null,
            skills: {},
        },
    });
    return interaction.reply({
        content: "🌟 You prestiged your career! You receive $1000 and permanent bonuses.",
        flags: "Ephemeral",
    });
}
// Command: Request loan (point 7)
async function requestLoan(interaction) {
    const user = interaction.user;
    const amount = Number(interaction.options.getNumber("amount"));
    if (!amount || amount < 100) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Loan Request Denied")
                    .setDescription("❌ The minimum amount to request a loan is **$100**.")
                    .setColor("Red"),
            ],
            flags: "Ephemeral",
        });
    }
    const interest = 0.1;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await main_1.main.prisma.userLoan.create({
        data: {
            userId: user.id,
            guildId: interaction.guildId,
            amount,
            interest,
            dueDate,
        },
    });
    const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guildId);
    await main_1.main.prisma.userEconomy.update({
        where: { userId_guildId: `${user.id}-${interaction.guildId}` },
        data: { balance: userBalance.balance + amount },
    });
    return interaction.reply({
        embeds: [
            new embeds_extend_1.EmbedCorrect()
                .setTitle("Loan Approved")
                .setDescription(`💸 You have received a loan of **$${amount}**.\n\n` +
                `**Interest:** 10%\n` +
                `**Due date:** <t:${Math.floor(dueDate.getTime() / 1000)}:R>\n\n` +
                `Remember you must repay a total of **$${Math.floor(amount * 1.1)}** within the next 7 days.`)
                .setFooter({ text: "Use /payloan to pay your loan before the due date." })
                .setColor("Green"),
        ],
        flags: "Ephemeral",
    });
}
// Command: Pay loan (point 7)
async function payLoan(interaction) {
    const user = interaction.user;
    const loan = await main_1.main.prisma.userLoan.findFirst({
        where: { userId: user.id, guildId: interaction.guildId, paid: false },
    });
    if (!loan) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("No Pending Loans")
                    .setDescription("❌ You have no pending loans to pay.")
                    .setColor("Red"),
            ],
            flags: "Ephemeral",
        });
    }
    const total = Math.floor(loan.amount * (1 + loan.interest));
    const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guildId);
    if (userBalance.balance < total) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Insufficient Funds")
                    .setDescription(`❌ You do not have enough money to pay your loan.\n\n` +
                    `**Total to pay:** $${total}\n` +
                    `**Your current balance:** $${userBalance.balance}`)
                    .setColor("Red"),
            ],
            flags: "Ephemeral",
        });
    }
    await main_1.main.prisma.userLoan.update({
        where: { id: loan.id },
        data: { paid: true },
    });
    await main_1.main.prisma.userEconomy.update({
        where: { userId_guildId: `${user.id}-${interaction.guildId}` },
        data: { balance: userBalance.balance - total },
    });
    return interaction.reply({
        embeds: [
            new embeds_extend_1.EmbedCorrect()
                .setTitle("Loan Paid")
                .setDescription(`✅ You have successfully paid your loan.\n\n` +
                `**Original amount:** $${loan.amount}\n` +
                `**Interest:** 10%\n` +
                `**Total paid:** $${total}\n` +
                `**Remaining balance:** $${userBalance.balance - total}`)
                .setFooter({ text: "Thank you for fulfilling your financial obligations!" })
                .setColor("Green"),
        ],
        flags: "Ephemeral",
    });
}
//# sourceMappingURL=work.js.map
//# debugId=2f5cf65e-9742-51c2-8963-30ec87926c65
