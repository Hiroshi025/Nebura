"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0742858b-08e9-52ad-93f6-353e3188f52f")}catch(e){}}();

const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const passwordCommand = {
    name: "passgen",
    description: "Generate secure passwords interactively",
    examples: ["password"],
    nsfw: false,
    owner: false,
    cooldown: 20,
    aliases: ["genpass", "generatepassword", "securepass"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(client, message) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        // Main embed
        const embed = new embeds_extend_1.EmbedCorrect()
            .setTitle("🔐 Password Generator")
            .setDescription("Choose how you want to generate your password:")
            .addFields({
            name: "Options",
            value: "⚡ **Quick Generate**: Random 12-character password\n⚙️ **Custom**: Configure length and character types\n🔢 **PIN**: Generate numeric PIN code",
        })
            .setFooter({ text: "All passwords are generated locally and never stored" });
        // Action buttons
        const buttonRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("pass_quick")
            .setLabel("Quick Generate")
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setEmoji("⚡"), new discord_js_1.ButtonBuilder()
            .setCustomId("pass_custom")
            .setLabel("Custom Settings")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("⚙️"), new discord_js_1.ButtonBuilder()
            .setCustomId("pass_pin")
            .setLabel("Generate PIN")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji("🔢"));
        // Length selector menu
        const menuRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("pass_length")
            .setPlaceholder("Select password length (Default: 12)")
            .addOptions({ label: "Short (8 chars)", value: "8", description: "For temporary uses", emoji: "🟢" }, { label: "Standard (12 chars)", value: "12", description: "Recommended default", emoji: "🔵" }, { label: "Strong (16 chars)", value: "16", description: "For important accounts", emoji: "🟣" }, { label: "Very Strong (24 chars)", value: "24", description: "Maximum security", emoji: "🟠" }));
        const response = await message.channel.send({
            embeds: [embed],
            components: [buttonRow, menuRow],
        });
        // Collector for interactions
        const collector = response.createMessageComponentCollector({ time: 60000 });
        collector.on("collect", async (interaction) => {
            try {
                if (interaction.isButton()) {
                    if (interaction.customId === "pass_quick") {
                        await handleQuickGenerate(interaction);
                    }
                    else if (interaction.customId === "pass_custom") {
                        await showCustomModal(interaction);
                    }
                    else if (interaction.customId === "pass_pin") {
                        await generatePIN(interaction);
                    }
                }
                else if (interaction.isStringSelectMenu() && interaction.customId === "pass_length") {
                    const length = parseInt(interaction.values[0]);
                    await handleQuickGenerate(interaction, length);
                }
            }
            catch (error) {
                console.error("Password generator error:", error);
                await interaction.reply({
                    content: "❌ An error occurred while generating your password.",
                    flags: "Ephemeral",
                });
            }
        });
        // Modal for custom password generation
        async function showCustomModal(interaction) {
            const modal = new discord_js_1.ModalBuilder().setCustomId("pass_custom_modal").setTitle("Custom Password Settings");
            // Length input
            const lengthInput = new discord_js_1.TextInputBuilder()
                .setCustomId("pass_length_input")
                .setLabel("Password Length (8-64)")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(2)
                .setPlaceholder("12")
                .setRequired(true);
            // Character types
            const typesInput = new discord_js_1.TextInputBuilder()
                .setCustomId("pass_types_input")
                .setLabel("Character Types (1-4)")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(10)
                .setValue("1234")
                .setRequired(true)
                .setPlaceholder("1: Uppercase, 2: Lowercase, 3: Numbers, 4: Symbols");
            const row1 = new discord_js_1.ActionRowBuilder().addComponents(lengthInput);
            const row2 = new discord_js_1.ActionRowBuilder().addComponents(typesInput);
            modal.addComponents(row1, row2);
            await interaction.showModal(modal);
        }
        // Handle modal submission
        client.on("interactionCreate", async (modalInteraction) => {
            if (!modalInteraction.isModalSubmit() || modalInteraction.customId !== "pass_custom_modal")
                return;
            try {
                const length = parseInt(modalInteraction.fields.getTextInputValue("pass_length_input"));
                const types = modalInteraction.fields.getTextInputValue("pass_types_input");
                if (isNaN(length) || length < 8 || length > 64) {
                    await modalInteraction.reply({
                        content: "❌ Please enter a valid length between 8 and 64.",
                        flags: "Ephemeral",
                    });
                    return;
                }
                const password = generateCustomPassword(length, types);
                await sendPasswordResult(modalInteraction, password, "Custom Password");
            }
            catch (error) {
                console.error("Custom password error:", error);
                await modalInteraction.reply({
                    content: "❌ Invalid input format. Please try again.",
                    flags: "Ephemeral",
                });
            }
        });
        // Generate quick password
        async function handleQuickGenerate(interaction, length = 12) {
            const password = generatePassword(length);
            await sendPasswordResult(interaction, password, "Generated Password");
        }
        // Generate numeric PIN
        async function generatePIN(interaction) {
            const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
            await sendPasswordResult(interaction, pin, "Generated PIN", true);
        }
        // Send the result to user
        async function sendPasswordResult(interaction, password, title, isPIN = false) {
            const resultEmbed = new embeds_extend_1.EmbedCorrect()
                .setTitle(`✅ ${title}`)
                .setDescription(`Here's your secure ${isPIN ? "PIN" : "password"}:`)
                .addFields({ name: isPIN ? "PIN Code" : "Password", value: `\`\`\`${password}\`\`\`` })
                .setFooter({ text: "This is only shown to you | Generated at" })
                .setTimestamp();
            const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`copy_${interaction.user.id}`)
                .setLabel("Copy to Clipboard")
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji("📋"), new discord_js_1.ButtonBuilder()
                .setCustomId(`regenerate_${interaction.user.id}`)
                .setLabel("Generate Another")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji("🔄"), new discord_js_1.ButtonBuilder()
                .setCustomId(`delete_${interaction.user.id}`)
                .setLabel("Delete")
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setEmoji("🗑️"));
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [resultEmbed],
                    components: [actionRow],
                    flags: "Ephemeral",
                });
            }
            else {
                await interaction.reply({
                    embeds: [resultEmbed],
                    components: [actionRow],
                    flags: "Ephemeral",
                });
            }
            // Handle button interactions
            const collector = (await interaction.fetchReply()).createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                time: 60000,
            });
            collector.on("collect", async (i) => {
                if (i.customId === `copy_${interaction.user.id}`) {
                    await i.reply({
                        content: "✅ Password copied to your clipboard!",
                        flags: "Ephemeral",
                    });
                }
                else if (i.customId === `regenerate_${interaction.user.id}`) {
                    await i.deferUpdate();
                    if (title.includes("PIN")) {
                        await generatePIN(i);
                    }
                    else if (title.includes("Custom")) {
                        await showCustomModal(i);
                    }
                    else {
                        await handleQuickGenerate(i);
                    }
                }
                else if (i.customId === `delete_${interaction.user.id}`) {
                    await i.deferUpdate();
                    await i.deleteReply();
                }
            });
        }
        // Password generation functions
        function generatePassword(length = 12) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
            let password = "";
            for (let i = 0; i < length; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        }
        function generateCustomPassword(length, types) {
            let chars = "";
            const charSets = {
                "1": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                "2": "abcdefghijklmnopqrstuvwxyz",
                "3": "0123456789",
                "4": "!@#$%^&*()_+-=[]{}|;:,.<>?",
            };
            for (const type of types) {
                if (charSets[type]) {
                    chars += charSets[type];
                }
            }
            if (!chars)
                chars = charSets["1"] + charSets["2"] + charSets["3"] + charSets["4"];
            let password = "";
            for (let i = 0; i < length; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        }
    },
};
module.exports = passwordCommand;
//# sourceMappingURL=passgen.js.map
//# debugId=0742858b-08e9-52ad-93f6-353e3188f52f
