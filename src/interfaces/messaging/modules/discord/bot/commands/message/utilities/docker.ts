import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder,
	ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { DockerImage, DockerImageDetail, Precommand } from "@typings/modules/discord";

const commandDocker: Precommand = {
  name: "docker",
  description: "Search for Docker images and display detailed information",
  examples: ["docker <image-name>", "docker nginx", "docker postgres"],
  nsfw: false,
  category: "Utilities",
  owner: false,
  aliases: ["dockerhub", "docker-image"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message, args, _prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // If no arguments, show search modal
    if (!args[0]) {
      return showDockerSearchModal(message);
    }

    const imageName = args[0];
    return searchAndDisplayDockerImages(message, imageName);
  },
};

async function showDockerSearchModal(message: any) {
  const modal = new ModalBuilder().setCustomId("docker_search_modal").setTitle("Search Docker Images");

  const searchInput = new TextInputBuilder()
    .setCustomId("search_input")
    .setLabel("Image name to search for")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("e.g. nginx, postgres, redis");

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput);
  modal.addComponents(firstActionRow);

  await message.showModal(modal);

  // Handle modal submission
  const filter = (interaction: any) => interaction.customId === "docker_search_modal";
  message
    .awaitModalSubmit({ filter, time: 60000 })
    .then(async (interaction: any) => {
      const imageName = interaction.fields.getTextInputValue("search_input");
      await interaction.deferReply();
      return searchAndDisplayDockerImages(interaction, imageName);
    })
    .catch(() => {});
}

async function searchAndDisplayDockerImages(message: any, imageName: string) {
  try {
    // Show loading message
    const loadingEmbed = new EmbedBuilder()
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
    } else {
      loadingMessage = await message.reply({ embeds: [loadingEmbed] });
    }

    // Search Docker Hub API
    const response = await axios.get(
      `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(imageName)}`,
    );
    const images: DockerImage[] = response.data.results.slice(0, 25); // Limit to 25 results

    if (images.length === 0) {
      const noResultsEmbed = new EmbedBuilder()
        .setColor("#FF5555")
        .setTitle("No Docker Images Found")
        .setDescription(`No images found matching "${imageName}"`)
        .setFooter({ text: "Try a different search term" });

      return loadingMessage.edit({ embeds: [noResultsEmbed], components: [] });
    }

    // Create select menu with image options
    const imageSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("docker_image_select")
        .setPlaceholder("Select an image for details")
        .addOptions(
          images.map((image) => ({
            label: image.repo_name.length > 100 ? `${image.repo_name.substring(0, 97)}...` : image.repo_name,
            description: image.short_description
              ? image.short_description.length > 50
                ? `${image.short_description.substring(0, 47)}...`
                : image.short_description
              : "No description",
            value: image.repo_name,
          })),
        ),
    );

    // Create buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("docker_refresh").setLabel("Refresh Results").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("docker_new_search").setLabel("New Search").setStyle(ButtonStyle.Primary),
    );

    const resultsEmbed = new EmbedBuilder()
      .setColor("#0099FF")
      .setTitle(`Docker Image Search Results (${images.length})`)
      .setDescription(`Found ${images.length} images matching "${imageName}"`)
      .addFields(
        {
          name: "Top Results",
          value: images
            .slice(0, 5)
            .map((img) => `• ${img.repo_name}`)
            .join("\n"),
          inline: true,
        },
        {
          name: "Stars",
          value: images
            .slice(0, 5)
            .map((img) => `⭐ ${img.star_count}`)
            .join("\n"),
          inline: true,
        },
        {
          name: "Pulls",
          value: images
            .slice(0, 5)
            .map((img) => `📥 ${img.pull_count}`)
            .join("\n"),
          inline: true,
        },
      )
      .setFooter({ text: "Select an image from the menu below for more details" });

    await loadingMessage.edit({
      embeds: [resultsEmbed],
      components: [imageSelect, buttons],
    });

    // Create collector for interactions
    const collector = loadingMessage.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (interaction: any) => {
      if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
      await interaction.deferUpdate();

      if (interaction.isStringSelectMenu()) {
        // Handle image selection
        const selectedImageName = interaction.values[0];
        const selectedImage = images.find((img) => img.repo_name === selectedImageName);
        if (selectedImage) {
          await showDockerImageDetails(interaction, selectedImage);
        }
      } else if (interaction.isButton()) {
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
      loadingMessage.edit({ components: [] }).catch(() => {});
    });
  } catch (error) {
    console.error("Error searching Docker images:", error);

    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error Searching Docker Hub")
      .setDescription("Failed to search for Docker images. Please try again later.")
      .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });

    message.reply({ embeds: [errorEmbed] });
  }
}

async function showDockerImageDetails(interaction: any, image: DockerImage) {
  try {
    // Fetch detailed information about the image
    const response = await axios.get(`https://hub.docker.com/v2/repositories/${image.repo_name}/`);
    const details: DockerImageDetail = response.data;

    // Fetch tags for the image
    const tagsResponse = await axios.get(
      `https://hub.docker.com/v2/repositories/${image.repo_name}/tags/?page_size=10`,
    );
    const tags = tagsResponse.data.results.map((tag: any) => tag.name);

    // Create embed with detailed information
    const detailEmbed = new EmbedBuilder()
      .setColor("#2496ED") // Docker blue
      .setTitle(image.repo_name)
      .setURL(`https://hub.docker.com/r/${image.repo_name}`)
      .setDescription(details.full_description || image.short_description || "No description available")
      .addFields(
        { name: "Stars", value: `⭐ ${image.star_count.toLocaleString()}`, inline: true },
        { name: "Pulls", value: `📥 ${image.pull_count.toLocaleString()}`, inline: true },
        {
          name: "Last Updated",
          value: details.last_updated ? new Date(details.last_updated).toLocaleDateString() : "Unknown",
          inline: true,
        },
        { name: "Official", value: image.is_official ? "✅ Yes" : "❌ No", inline: true },
        { name: "Automated", value: image.is_automated ? "✅ Yes" : "❌ No", inline: true },
        { name: "Publisher", value: details.user || "Unknown", inline: true },
        {
          name: "Recent Tags",
          value: tags.length > 0 ? tags.join(", ") : "No tags found",
          inline: false,
        },
      )
      .setFooter({ text: "Docker Hub" });

    // Create buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("View on Docker Hub")
        .setURL(`https://hub.docker.com/r/${image.repo_name}`)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setCustomId("docker_view_all_tags")
        .setLabel("View All Tags")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(tags.length === 0),
      new ButtonBuilder()
        .setCustomId("docker_back_to_results")
        .setLabel("Back to Results")
        .setStyle(ButtonStyle.Primary),
    );

    if (interaction.isRepliable && interaction.isRepliable()) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [detailEmbed], components: [buttons] });
      } else {
        await interaction.editReply({ embeds: [detailEmbed], components: [buttons] });
      }
    }

    // Handle button interactions
    const collector = interaction.message.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (btnInteraction: any) => {
      if (!btnInteraction.isButton()) return;

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
      interaction.message.edit({ components: [] }).catch(() => {});
    });
  } catch (error) {
    console.error("Error fetching Docker image details:", error);

    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error Fetching Image Details")
      .setDescription("Failed to fetch detailed information for this Docker image.")
      .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });

    interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function showAllTags(interaction: any, imageName: string) {
  try {
    // Fetch all tags for the image
    const response = await axios.get(`https://hub.docker.com/v2/repositories/${imageName}/tags/?page_size=50`);
    const tags = response.data.results.map((tag: any) => tag.name);

    if (tags.length === 0) {
      const noTagsEmbed = new EmbedBuilder()
        .setColor("#FF5555")
        .setTitle("No Tags Found")
        .setDescription(`No tags found for image ${imageName}`);

      return interaction.editReply({ embeds: [noTagsEmbed] });
    }

    // Create paginated tag list
    const pages: EmbedBuilder[] = [];
    const tagsPerPage = 10;

    for (let i = 0; i < tags.length; i += tagsPerPage) {
      const pageTags = tags.slice(i, i + tagsPerPage);

      const tagEmbed = new EmbedBuilder()
        .setColor("#2496ED")
        .setTitle(`Tags for ${imageName}`)
        .setDescription(pageTags.map((tag: any) => `• ${tag}`).join("\n"))
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
      componentType: ComponentType.Button,
      time: 60000,
    });

    paginationCollector.on("collect", async (pageInteraction: any) => {
      if (!pageInteraction.isButton()) return;

      await pageInteraction.deferUpdate();

      const action = pageInteraction.customId.split("_")[1];

      if (action === "prev" && currentPage > 0) {
        currentPage--;
      } else if (action === "next" && currentPage < pages.length - 1) {
        currentPage++;
      } else if (action === "close") {
        return pageInteraction.deleteReply();
      }

      await pageInteraction.editReply({
        embeds: [pages[currentPage]],
        components: [createPaginationButtons(currentPage, pages.length, "tags")], // <-- array
      });
    });

    paginationCollector.on("end", () => {
      tagMessage.edit({ components: [] }).catch(() => {});
    });
  } catch (error) {
    console.error("Error fetching Docker image tags:", error);

    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error Fetching Tags")
      .setDescription("Failed to fetch tags for this Docker image.")
      .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });

    interaction.editReply({ embeds: [errorEmbed] });
  }
}

function createPaginationButtons(currentPage: number, totalPages: number, type: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${type}_prev`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`${type}_next`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1),
    new ButtonBuilder().setCustomId(`${type}_close`).setLabel("✖").setStyle(ButtonStyle.Danger),
  );
}

export default commandDocker;
