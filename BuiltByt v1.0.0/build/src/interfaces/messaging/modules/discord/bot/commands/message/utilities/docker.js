"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="36a8d7e0-7171-50d8-ae9d-4aeb1c24d14b")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const commandDocker = {
    name: "docker",
    description: "Search for Docker images and display detailed information",
    examples: ["docker <image-name>", "docker nginx", "docker postgres"],
    nsfw: false,
    owner: false,
    aliases: ["dockerhub", "docker-image"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(_client, message, args, _prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        // If no arguments, show search modal
        if (!args[0]) {
            return showDockerSearchModal(message);
        }
        const imageName = args[0];
        return searchAndDisplayDockerImages(message, imageName);
    },
};
async function showDockerSearchModal(message) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId("docker_search_modal")
        .setTitle("Search Docker Images");
    const searchInput = new discord_js_1.TextInputBuilder()
        .setCustomId("search_input")
        .setLabel("Image name to search for")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("e.g. nginx, postgres, redis");
    const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(searchInput);
    modal.addComponents(firstActionRow);
    await message.showModal(modal);
    // Handle modal submission
    const filter = (interaction) => interaction.customId === "docker_search_modal";
    message
        .awaitModalSubmit({ filter, time: 60000 })
        .then(async (interaction) => {
        const imageName = interaction.fields.getTextInputValue("search_input");
        await interaction.deferReply();
        return searchAndDisplayDockerImages(interaction, imageName);
    })
        .catch(() => { });
}
async function searchAndDisplayDockerImages(message, imageName) {
    try {
        // Show loading message
        const loadingEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#0099FF")
            .setTitle("Searching Docker Hub")
            .setDescription(`Looking for images matching "${imageName}"...`)
            .setFooter({ text: "This may take a few seconds" });
        let loadingMessage;
        if (message.isRepliable && message.isRepliable()) {
            if (!message.replied && !message.deferred) {
                await message.deferReply();
            }
            loadingMessage = await message.editReply({ embeds: [loadingEmbed] });
        }
        else {
            loadingMessage = await message.reply({ embeds: [loadingEmbed] });
        }
        // Search Docker Hub API
        const response = await axios_1.default.get(`https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(imageName)}`);
        const images = response.data.results.slice(0, 25); // Limit to 25 results
        if (images.length === 0) {
            const noResultsEmbed = new discord_js_1.EmbedBuilder()
                .setColor("#FF5555")
                .setTitle("No Docker Images Found")
                .setDescription(`No images found matching "${imageName}"`)
                .setFooter({ text: "Try a different search term" });
            return loadingMessage.edit({ embeds: [noResultsEmbed], components: [] });
        }
        // Create select menu with image options
        const imageSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("docker_image_select")
            .setPlaceholder("Select an image for details")
            .addOptions(images.map((image) => ({
            label: image.repo_name.length > 100
                ? `${image.repo_name.substring(0, 97)}...`
                : image.repo_name,
            description: image.short_description
                ? image.short_description.length > 50
                    ? `${image.short_description.substring(0, 47)}...`
                    : image.short_description
                : "No description",
            value: image.repo_name,
        }))));
        // Create buttons
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("docker_refresh")
            .setLabel("Refresh Results")
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId("docker_new_search")
            .setLabel("New Search")
            .setStyle(discord_js_1.ButtonStyle.Primary));
        const resultsEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#0099FF")
            .setTitle(`Docker Image Search Results (${images.length})`)
            .setDescription(`Found ${images.length} images matching "${imageName}"`)
            .addFields({
            name: "Top Results",
            value: images
                .slice(0, 5)
                .map((img) => `• ${img.repo_name}`)
                .join("\n"),
            inline: true,
        }, {
            name: "Stars",
            value: images
                .slice(0, 5)
                .map((img) => `⭐ ${img.star_count}`)
                .join("\n"),
            inline: true,
        }, {
            name: "Pulls",
            value: images
                .slice(0, 5)
                .map((img) => `📥 ${img.pull_count}`)
                .join("\n"),
            inline: true,
        })
            .setFooter({ text: "Select an image from the menu below for more details" });
        await loadingMessage.edit({
            embeds: [resultsEmbed],
            components: [imageSelect, buttons],
        });
        // Create collector for interactions
        const collector = loadingMessage.createMessageComponentCollector({
            time: 60000,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction.isStringSelectMenu() && !interaction.isButton())
                return;
            await interaction.deferUpdate();
            if (interaction.isStringSelectMenu()) {
                // Handle image selection
                const selectedImageName = interaction.values[0];
                const selectedImage = images.find((img) => img.repo_name === selectedImageName);
                if (selectedImage) {
                    await showDockerImageDetails(interaction, selectedImage);
                }
            }
            else if (interaction.isButton()) {
                switch (interaction.customId) {
                    case "docker_refresh":
                        await searchAndDisplayDockerImages(interaction, imageName);
                        break;
                    case "docker_new_search":
                        await showDockerSearchModal(interaction);
                        break;
                }
            }
        });
        collector.on("end", () => {
            loadingMessage.edit({ components: [] }).catch(() => { });
        });
    }
    catch (error) {
        console.error("Error searching Docker images:", error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Error Searching Docker Hub")
            .setDescription("Failed to search for Docker images. Please try again later.")
            .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });
        message.reply({ embeds: [errorEmbed] });
    }
}
async function showDockerImageDetails(interaction, image) {
    try {
        // Fetch detailed information about the image
        const response = await axios_1.default.get(`https://hub.docker.com/v2/repositories/${image.repo_name}/`);
        const details = response.data;
        // Fetch tags for the image
        const tagsResponse = await axios_1.default.get(`https://hub.docker.com/v2/repositories/${image.repo_name}/tags/?page_size=10`);
        const tags = tagsResponse.data.results.map((tag) => tag.name);
        // Create embed with detailed information
        const detailEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#2496ED") // Docker blue
            .setTitle(image.repo_name)
            .setURL(`https://hub.docker.com/r/${image.repo_name}`)
            .setDescription(details.full_description || image.short_description || "No description available")
            .addFields({ name: "Stars", value: `⭐ ${image.star_count.toLocaleString()}`, inline: true }, { name: "Pulls", value: `📥 ${image.pull_count.toLocaleString()}`, inline: true }, {
            name: "Last Updated",
            value: details.last_updated
                ? new Date(details.last_updated).toLocaleDateString()
                : "Unknown",
            inline: true,
        }, { name: "Official", value: image.is_official ? "✅ Yes" : "❌ No", inline: true }, { name: "Automated", value: image.is_automated ? "✅ Yes" : "❌ No", inline: true }, { name: "Publisher", value: details.user || "Unknown", inline: true }, {
            name: "Recent Tags",
            value: tags.length > 0 ? tags.join(", ") : "No tags found",
            inline: false,
        })
            .setFooter({ text: "Docker Hub" });
        // Create buttons
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel("View on Docker Hub")
            .setURL(`https://hub.docker.com/r/${image.repo_name}`)
            .setStyle(discord_js_1.ButtonStyle.Link), new discord_js_1.ButtonBuilder()
            .setCustomId("docker_view_all_tags")
            .setLabel("View All Tags")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(tags.length === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("docker_back_to_results")
            .setLabel("Back to Results")
            .setStyle(discord_js_1.ButtonStyle.Primary));
        if (interaction.isRepliable && interaction.isRepliable()) {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [detailEmbed], components: [buttons] });
            }
            else {
                await interaction.editReply({ embeds: [detailEmbed], components: [buttons] });
            }
        }
        // Handle button interactions
        const collector = interaction.message.createMessageComponentCollector({
            time: 60000,
        });
        collector.on("collect", async (btnInteraction) => {
            if (!btnInteraction.isButton())
                return;
            await btnInteraction.deferUpdate();
            switch (btnInteraction.customId) {
                case "docker_view_all_tags":
                    await showAllTags(btnInteraction, image.repo_name);
                    break;
                case "docker_back_to_results":
                    await interaction.editReply({
                        embeds: [interaction.message.embeds[0]],
                        components: interaction.message.components,
                    });
                    break;
            }
        });
        collector.on("end", () => {
            interaction.message.edit({ components: [] }).catch(() => { });
        });
    }
    catch (error) {
        console.error("Error fetching Docker image details:", error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Error Fetching Image Details")
            .setDescription("Failed to fetch detailed information for this Docker image.")
            .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });
        interaction.editReply({ embeds: [errorEmbed] });
    }
}
async function showAllTags(interaction, imageName) {
    try {
        // Fetch all tags for the image
        const response = await axios_1.default.get(`https://hub.docker.com/v2/repositories/${imageName}/tags/?page_size=50`);
        const tags = response.data.results.map((tag) => tag.name);
        if (tags.length === 0) {
            const noTagsEmbed = new discord_js_1.EmbedBuilder()
                .setColor("#FF5555")
                .setTitle("No Tags Found")
                .setDescription(`No tags found for image ${imageName}`);
            return interaction.editReply({ embeds: [noTagsEmbed] });
        }
        // Create paginated tag list
        const pages = [];
        const tagsPerPage = 10;
        for (let i = 0; i < tags.length; i += tagsPerPage) {
            const pageTags = tags.slice(i, i + tagsPerPage);
            const tagEmbed = new discord_js_1.EmbedBuilder()
                .setColor("#2496ED")
                .setTitle(`Tags for ${imageName}`)
                .setDescription(pageTags.map((tag) => `• ${tag}`).join("\n"))
                .setFooter({
                text: `Page ${Math.floor(i / tagsPerPage) + 1}/${Math.ceil(tags.length / tagsPerPage)} | Total tags: ${tags.length}`,
            });
            pages.push(tagEmbed);
        }
        let currentPage = 0;
        const tagMessage = await interaction.editReply({
            embeds: [pages[currentPage]],
            components: [createPaginationButtons(currentPage, pages.length, "tags")], // <-- array
        });
        // Handle pagination
        const paginationCollector = tagMessage.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 60000,
        });
        paginationCollector.on("collect", async (pageInteraction) => {
            if (!pageInteraction.isButton())
                return;
            await pageInteraction.deferUpdate();
            const action = pageInteraction.customId.split("_")[1];
            if (action === "prev" && currentPage > 0) {
                currentPage--;
            }
            else if (action === "next" && currentPage < pages.length - 1) {
                currentPage++;
            }
            else if (action === "close") {
                return pageInteraction.deleteReply();
            }
            await pageInteraction.editReply({
                embeds: [pages[currentPage]],
                components: [createPaginationButtons(currentPage, pages.length, "tags")], // <-- array
            });
        });
        paginationCollector.on("end", () => {
            tagMessage.edit({ components: [] }).catch(() => { });
        });
    }
    catch (error) {
        console.error("Error fetching Docker image tags:", error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Error Fetching Tags")
            .setDescription("Failed to fetch tags for this Docker image.")
            .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });
        interaction.editReply({ embeds: [errorEmbed] });
    }
}
function createPaginationButtons(currentPage, totalPages, type) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`${type}_prev`)
        .setLabel("◀")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(currentPage === 0), new discord_js_1.ButtonBuilder()
        .setCustomId(`${type}_next`)
        .setLabel("▶")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1), new discord_js_1.ButtonBuilder().setCustomId(`${type}_close`).setLabel("✖").setStyle(discord_js_1.ButtonStyle.Danger));
}
module.exports = commandDocker;
//# sourceMappingURL=docker.js.map
//# debugId=36a8d7e0-7171-50d8-ae9d-4aeb1c24d14b
