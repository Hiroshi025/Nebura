"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9b53748c-e1a1-59f5-b272-06f946a56887")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createButton = createButton;
exports.getMenuOptions = getMenuOptions;
exports.createMenuOption = createMenuOption;
exports.updateEmbedField = updateEmbedField;
exports.validateImage = validateImage;
exports.disableComponents = disableComponents;
exports.enableComponents = enableComponents;
exports.hexToInt = hexToInt;
exports.temporaryMessage = temporaryMessage;
exports.chunk = chunk;
exports.countMessage = countMessage;
exports.generateToken = generateToken;
exports.toFixedNumber = toFixedNumber;
exports.isValidObjectId = isValidObjectId;
exports.fetchBalance = fetchBalance;
exports.getBalance = getBalance;
exports.Economy = Economy;
exports.createUser = createUser;
exports.createGuild = createGuild;
exports.handleUser = handleUser;
exports.handleRepository = handleRepository;
exports.handleSearch = handleSearch;
exports.createMainEmbed = createMainEmbed;
exports.createStatsEmbed = createStatsEmbed;
exports.createComponents = createComponents;
exports.createCollectors = createCollectors;
exports.showRoles = showRoles;
exports.showEmojis = showEmojis;
exports.showFeatures = showFeatures;
exports.showBans = showBans;
exports.showBoostInfo = showBoostInfo;
exports.showSecurityInfo = showSecurityInfo;
exports.showFeaturedChannels = showFeaturedChannels;
exports.showWidgetInfo = showWidgetInfo;
exports.translateNSFWLevel = translateNSFWLevel;
exports.translateVerificationLevel = translateVerificationLevel;
exports.translateContentFilter = translateContentFilter;
exports.translateNotificationLevel = translateNotificationLevel;
exports.translateFeature = translateFeature;
exports.getBoostBenefits = getBoostBenefits;
exports.getTargetUserv2 = getTargetUserv2;
exports.createMainEmbedv2 = createMainEmbedv2;
exports.createStatusEmbed = createStatusEmbed;
exports.createComponentsv2 = createComponentsv2;
exports.createCollectorsv2 = createCollectorsv2;
exports.showRolesv2 = showRolesv2;
exports.showBadges = showBadges;
exports.showPermissions = showPermissions;
exports.showAccountInfo = showAccountInfo;
exports.showActivities = showActivities;
exports.showUsernameHistory = showUsernameHistory;
exports.showProfileBanner = showProfileBanner;
exports.getUserBadges = getUserBadges;
exports.getDetailedBadges = getDetailedBadges;
exports.translateStatus = translateStatus;
exports.translateActivityType = translateActivityType;
exports.translatePermission = translatePermission;
exports.parseInput = parseInput;
exports.createEvalContext = createEvalContext;
exports.createDebugInfo = createDebugInfo;
exports.sendResponse = sendResponse;
exports.setupCollectors = setupCollectors;
exports.sendError = sendError;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
const moment_1 = __importDefault(require("moment"));
const util_1 = require("util");
const main_1 = require("../../../../../../main");
const embeds_extend_1 = require("../../../../../../shared/adapters/extends/embeds.extend");
const emojis_json_1 = __importDefault(require("../../../../../../../config/json/emojis.json"));
const config_1 = require("../../../../../../shared/utils/config");
const sleep = (0, util_1.promisify)(setTimeout);
const MAX_OUTPUT_LENGTH = 1000;
const MAX_DEBUG_INFO_LENGTH = 1500;
/**
 * Creates a new Discord button.
 *
 * @param customId - The custom ID for the button.
 * @param label - The label displayed on the button.
 * @param style - The style of the button (e.g., Primary, Secondary, etc.).
 * @returns A `ButtonBuilder` instance representing the button.
 */
function createButton(customId, label, style) {
    return new discord_js_1.ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
}
/**
 * Generates a list of predefined menu options for a Discord select menu.
 *
 * @returns An array of `StringSelectMenuOptionBuilder` instances representing the menu options.
 */
function getMenuOptions() {
    return [
        createMenuOption("Author", "Author section of the embeds", "author"),
        createMenuOption("Author Icon", "Icon of the author section of the embeds", "author-icon"),
        createMenuOption("Title", "Title of the embeds", "title"),
        createMenuOption("Title Url", "Url of the title of the embeds", "title-url"),
        createMenuOption("Description", "Description of the embeds", "description"),
        createMenuOption("Color", "Color of the embeds", "color"),
        createMenuOption("Attachment", "Attachment of the embeds", "image"),
        createMenuOption("Thumbnail", "Thumbnail of the embeds", "thumbnail"),
        createMenuOption("Footer", "Footer of the embeds", "footer"),
        createMenuOption("Footer Icon", "Icon of the Footer of the embeds", "footer-icon"),
        createMenuOption("Timestamp", "Toggle timestamp on the embeds", "timestamp"),
        createMenuOption("Field Settings", "Add or Remove a Fields section to the embeds", "fields"),
    ];
}
/**
 * Creates a single menu option for a Discord select menu.
 *
 * @param label - The label displayed for the menu option.
 * @param description - A brief description of the menu option.
 * @param value - The value associated with the menu option.
 * @returns A `StringSelectMenuOptionBuilder` instance representing the menu option.
 */
function createMenuOption(label, description, value) {
    return new discord_js_1.StringSelectMenuOptionBuilder().setLabel(label).setDescription(description).setValue(value);
}
/**
 * Updates a specific field in a Discord embed based on the provided option and content.
 *
 * @param embeds - The embed object to update.
 * @param option - The field to update (e.g., "author", "title", etc.).
 * @param content - The new content for the specified field.
 * @param attachment - Optional attachment data for image-related fields.
 */
function updateEmbedField(embeds, option, content, attachment) {
    switch (option) {
        case "author":
            embeds.data.author = { ...embeds.data.author, name: content };
            break;
        case "author-icon":
            embeds.data.author = {
                ...embeds.data.author,
                icon_url: validateImage(attachment, content),
            };
            break;
        case "title":
            embeds.data.title = content;
            break;
        case "title-url":
            if (content.startsWith("https://"))
                embeds.data.url = content;
            else
                temporaryMessage(embeds.channel, "Please provide a valid URL!");
            break;
        case "description":
            embeds.data.description = content;
            break;
        case "color":
            if (/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/i.test(content)) {
                embeds.data.color = hexToInt(content);
            }
            else {
                temporaryMessage(embeds.channel, "Please provide a valid hex color code!");
            }
            break;
        case "image":
            embeds.data.image = { url: validateImage(attachment, content) };
            break;
        case "thumbnail":
            embeds.data.thumbnail = { url: validateImage(attachment, content) };
            break;
        case "footer":
            embeds.data.footer = { ...embeds.data.footer, text: content };
            break;
        case "footer-icon":
            embeds.data.footer = {
                ...embeds.data.footer,
                icon_url: validateImage(attachment, content),
            };
            break;
    }
}
/**
 * Validates and returns a valid image URL for Discord embeds.
 *
 * @param attachment - Optional attachment data to validate.
 * @param content - The URL or content to validate.
 * @returns A valid image URL.
 * @throws An error if the content is not a valid image or URL.
 */
function validateImage(attachment, content) {
    if (attachment && attachment.contentType?.includes("image"))
        return attachment.url;
    if (content.startsWith("https://"))
        return content;
    throw new Error("Discord Embeds only support images/GIFs or direct URLs!");
}
/**
 * Disables all components in the provided list of Discord components.
 *
 * @param components - The components to disable.
 */
function disableComponents(...components) {
    components.forEach((component) => component.components.forEach((c) => c.setDisabled(true)));
}
/**
 * Enables all components in the provided list of Discord components.
 *
 * @param components - The components to enable.
 */
function enableComponents(...components) {
    components.forEach((component) => component.components.forEach((c) => c.setDisabled(false)));
}
/**
 * Converts a hexadecimal color code to an integer.
 *
 * @param input - The hexadecimal color code (e.g., "#FFFFFF").
 * @returns The integer representation of the color.
 */
function hexToInt(input) {
    return parseInt(input.replace(/^#([\da-f])([\da-f])([\da-f])$/i, "#$1$1$2$2$3$3").substring(1), 16);
}
/**
 * Sends a temporary message to a Discord text channel and deletes it after 5 seconds.
 *
 * @param channel - The text channel to send the message to.
 * @param message - The content of the message.
 * @returns A promise that resolves when the message is deleted.
 */
async function temporaryMessage(channel, message) {
    const tempMsg = await channel.send(message);
    setTimeout(() => tempMsg.delete(), 5000);
}
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
async function countMessage(userId, guildId, message) {
    try {
        const data = await main_1.main.prisma.userEconomy.findFirst({
            where: {
                userId,
            },
        });
        if (!data || !message.guild)
            return false;
        const channelId = message.channel.id;
        const guildData = await main_1.main.prisma.myGuild.findFirst({ where: { guildId } });
        if (guildData) {
            const activity = guildData.channelActivity || {};
            activity[channelId] = (activity[channelId] || 0) + 1;
            await main_1.main.prisma.myGuild.update({
                where: { id: guildData.id },
                data: { channelActivity: activity },
            });
        }
        await main_1.main.prisma.userEconomy.updateMany({
            where: {
                userId,
                guildId,
            },
            data: {
                messageCount: (data.messageCount ?? 0) + 1,
            },
        });
        return true;
    }
    catch (err) {
        console.error("Error updating channel activity:", err);
        return false;
    }
}
function generateToken(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
async function toFixedNumber(number, places = 2) {
    const offset = Number(`1e${places}`);
    return Math.floor(number * offset) / offset;
}
/**
 * Validates if a string is a valid ObjectID or a Discord snowflake ID.
 *
 * @param id - The string to validate.
 * @returns True if the string is a valid ObjectID or Discord ID, otherwise false.
 */
function isValidObjectId(id) {
    const objectIdPattern = /^[a-fA-F0-9]{24}$/; // MongoDB ObjectID pattern
    const discordIdPattern = /^\d{17,20}$/; // Discord snowflake ID pattern
    return objectIdPattern.test(id) || discordIdPattern.test(id);
}
async function fetchBalance(userId, guildId) {
    if (!isValidObjectId(userId)) {
        console.error(`Invalid userId format: ${userId}`);
        throw new Error("Invalid userId format. Must be a valid ObjectID.");
    }
    if (!isValidObjectId(guildId)) {
        console.error(`Invalid guildId format: ${guildId}`);
        throw new Error("Invalid guildId format. Must be a valid ObjectID.");
    }
    let dbBalance = await main_1.main.prisma.userEconomy.findFirst({
        where: {
            userId: userId,
            guildId: guildId,
        },
    });
    if (!dbBalance) {
        dbBalance = await main_1.main.prisma.userEconomy.create({
            data: {
                userId_guildId: `${userId}-${guildId}`,
                userId: userId,
                guildId: guildId,
                balance: 0,
            },
        });
        return dbBalance;
    }
    return dbBalance;
}
/**
 * Fetches the balance of a user in a specific guild.
 *
 * @param userId
 * @param guildId
 * @returns
 */
async function getBalance(userId, guildId) {
    if (!isValidObjectId(userId)) {
        console.error(`Invalid userId format: ${userId}`);
        throw new Error("Invalid userId format. Must be a valid ObjectID.");
    }
    if (!isValidObjectId(guildId)) {
        console.error(`Invalid guildId format: ${guildId}`);
        throw new Error("Invalid guildId format. Must be a valid ObjectID.");
    }
    let dbBalance = await main_1.main.prisma.userEconomy.findFirst({
        where: {
            userId: userId,
            guildId: guildId,
        },
    });
    if (!dbBalance)
        return false;
    return dbBalance;
}
/**
 * Updates the economy balance of a user in a specific guild by adding a random amount.
 *
 * @param message - The Discord message object.
 */
async function Economy(message) {
    if (message.author.bot || !message.guild)
        return;
    const randomAmount = Math.random() * (0.7 - 0.3) + 0.3;
    const dbBalance = await fetchBalance(message.author.id, message.guild.id);
    console.log(await toFixedNumber(dbBalance.balance + randomAmount));
    await main_1.main.prisma.userEconomy.updateMany({
        where: { userId: message.author.id },
        data: {
            balance: await toFixedNumber(dbBalance.balance + randomAmount),
        },
    });
}
async function createUser(userId) {
    if (!isValidObjectId(userId)) {
        console.error(`Invalid userId format: ${userId}`);
        throw new Error("Invalid userId format. Must be a valid ObjectID.");
    }
    const dbUser = await main_1.main.prisma.userDiscord.findFirst({
        where: {
            userId: userId,
        },
    });
    if (!dbUser) {
        await main_1.main.prisma.userDiscord.create({
            data: {
                userId: userId,
            },
        });
    }
    return dbUser;
}
async function createGuild(guildId, client) {
    if (!guildId || !client.user)
        return false;
    const guild = await main_1.main.prisma.myGuild.findFirst({
        where: {
            guildId,
        },
    });
    const data = await main_1.main.DB.findDiscord(client.user?.id);
    if (!data)
        return;
    if (!guild) {
        await main_1.main.prisma.myGuild.create({
            data: {
                prefix: config_1.config.modules.discord.prefix,
                guildId: guildId,
                discordId: data.clientId,
            },
        });
    }
    return true;
}
async function handleUser(message, username) {
    try {
        const response = await axios_1.default.get(`https://api.github.com/users/${username}`, {
            headers: {
                "User-Agent": "DiscordBot (https://github.com)",
            },
        });
        const userData = response.data;
        // Main user embed
        const userEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`${userData.name || userData.login} ${userData.type === "Organization" ? "🏢" : "👤"}`)
            .setURL(userData.html_url)
            .setColor(0x24292e) // GitHub dark color
            .setThumbnail(userData.avatar_url)
            .setDescription(userData.bio || "No bio provided")
            .addFields({ name: "Public Repos", value: userData.public_repos.toString(), inline: true }, { name: "Followers", value: userData.followers.toString(), inline: true }, { name: "Following", value: userData.following.toString(), inline: true }, {
            name: "Created",
            value: new Date(userData.created_at).toLocaleDateString(),
            inline: true,
        }, { name: "Location", value: userData.location || "Not specified", inline: true }, { name: "Company", value: userData.company || "None", inline: true });
        // Additional fields if available
        if (userData.blog) {
            userEmbed.addFields({
                name: "Website",
                value: `[${userData.blog}](${userData.blog.startsWith("http") ? userData.blog : `https://${userData.blog}`})`,
                inline: true,
            });
        }
        if (userData.twitter_username) {
            userEmbed.addFields({
                name: "Twitter",
                value: `[@${userData.twitter_username}](https://twitter.com/${userData.twitter_username})`,
                inline: true,
            });
        }
        // Get user's repositories
        const reposResponse = await axios_1.default.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`, {
            headers: {
                "User-Agent": "DiscordBot (https://github.com)",
            },
        });
        const repos = reposResponse.data;
        // Create buttons
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setLabel("View Profile").setURL(userData.html_url).setStyle(discord_js_1.ButtonStyle.Link), new discord_js_1.ButtonBuilder().setLabel("View Repositories").setCustomId("view_repos").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setLabel("View Starred").setCustomId("view_starred").setStyle(discord_js_1.ButtonStyle.Primary));
        // Send initial message
        const msg = await message.reply({
            embeds: [userEmbed],
            components: [buttons],
        });
        // Collector for interactions
        const collector = msg.createMessageComponentCollector({
            time: 60000, // 1 minute
            componentType: discord_js_1.ComponentType.Button,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction.isButton())
                return;
            await interaction.deferUpdate();
            switch (interaction.customId) {
                case "view_repos": {
                    const reposEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(`Recent Repositories by ${userData.login}`)
                        .setColor(0x24292e)
                        .setDescription(repos
                        .map((repo) => {
                        const emoji = repo.fork ? "🔀" : repo.archived ? "🗄️" : "📦";
                        return `${emoji} [${repo.name}](${repo.html_url}) - ${repo.stargazers_count} ⭐ - ${repo.language || "No language"}`;
                    })
                        .join("\n"));
                    await interaction.editReply({ embeds: [userEmbed, reposEmbed] });
                    break;
                }
                case "view_starred": {
                    try {
                        const starredResponse = await axios_1.default.get(`https://api.github.com/users/${username}/starred?per_page=5`, {
                            headers: {
                                "User-Agent": "DiscordBot (https://github.com)",
                            },
                        });
                        const starredRepos = starredResponse.data;
                        const starredEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`Recently Starred by ${userData.login}`)
                            .setColor(0x24292e)
                            .setDescription(starredRepos
                            .map((repo) => {
                            return `⭐ [${repo.full_name}](${repo.html_url}) - ${repo.stargazers_count} stars - ${repo.language || "No language"}`;
                        })
                            .join("\n") || "No starred repositories");
                        await interaction.editReply({ embeds: [userEmbed, starredEmbed] });
                    }
                    catch (error) {
                        console.error("Error fetching starred repos:", error);
                        await interaction.editReply({ embeds: [userEmbed] });
                    }
                    break;
                }
            }
        });
        collector.on("end", () => {
            msg.edit({ components: [] }).catch(console.error);
        });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            return message.reply(`GitHub user "${username}" not found.`);
        }
        console.error("Error fetching GitHub user:", error);
        return message.reply("An error occurred while fetching GitHub user information.");
    }
    return;
}
async function handleRepository(message, repoPath) {
    try {
        const [owner, repoName] = repoPath.split("/");
        const response = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repoName}`, {
            headers: {
                "User-Agent": "DiscordBot (https://github.com)",
            },
        });
        const repoData = response.data;
        // Main repo embed
        const repoEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`${repoData.full_name} ${repoData.archived ? "🗄️ (Archived)" : ""}`)
            .setURL(repoData.html_url)
            .setColor(0x24292e)
            .setDescription(repoData.description || "No description provided")
            .addFields({ name: "Stars", value: repoData.stargazers_count.toString(), inline: true }, { name: "Forks", value: repoData.forks_count.toString(), inline: true }, { name: "Watchers", value: repoData.watchers_count.toString(), inline: true }, { name: "Language", value: repoData.language || "Not specified", inline: true }, { name: "License", value: repoData.license?.name || "None", inline: true }, { name: "Open Issues", value: repoData.open_issues_count.toString(), inline: true }, {
            name: "Created",
            value: new Date(repoData.created_at).toLocaleDateString(),
            inline: true,
        }, {
            name: "Last Updated",
            value: new Date(repoData.updated_at).toLocaleDateString(),
            inline: true,
        }, { name: "Default Branch", value: repoData.default_branch, inline: true });
        // Add topics if available
        if (repoData.topics && repoData.topics.length > 0) {
            repoEmbed.addFields({
                name: "Topics",
                value: repoData.topics.map((topic) => `\`${topic}\``).join(" "),
                inline: false,
            });
        }
        // Add homepage if available
        if (repoData.homepage) {
            repoEmbed.addFields({
                name: "Homepage",
                value: `[${repoData.homepage}](${repoData.homepage.startsWith("http") ? repoData.homepage : `https://${repoData.homepage}`})`,
                inline: false,
            });
        }
        // Create buttons
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setLabel("View Repository").setURL(repoData.html_url).setStyle(discord_js_1.ButtonStyle.Link), new discord_js_1.ButtonBuilder().setLabel("View Owner").setCustomId("view_owner").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setLabel("View Readme").setCustomId("view_readme").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setLabel("View Languages").setCustomId("view_languages").setStyle(discord_js_1.ButtonStyle.Secondary));
        // Get branches for select menu
        const branchesResponse = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
            headers: {
                "User-Agent": "DiscordBot (https://github.com)",
            },
        });
        const branches = branchesResponse.data.slice(0, 25);
        const branchSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("select_branch")
            .setPlaceholder("Select a branch")
            .addOptions(branches.map((branch) => ({
            label: branch.name,
            value: branch.name,
            description: `Branch ${branch.name}`,
            default: branch.name === repoData.default_branch,
        }))));
        // Send initial message
        const msg = await message.reply({
            embeds: [repoEmbed],
            components: [buttons, branchSelect],
        });
        // Collector for interactions
        const collector = msg.createMessageComponentCollector({
            time: 60000,
            componentType: discord_js_1.ComponentType.Button,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction.isButton())
                return;
            await interaction.deferUpdate();
            switch (interaction.customId) {
                case "view_owner": {
                    return handleUser(message, repoData.owner.login);
                }
                case "view_readme": {
                    try {
                        const readmeResponse = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repoName}/readme`, {
                            headers: {
                                "User-Agent": "DiscordBot (https://github.com)",
                                Accept: "application/vnd.github.v3.raw",
                            },
                        });
                        const readmeText = readmeResponse.data;
                        const readmeEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`README for ${repoData.full_name}`)
                            .setColor(0x24292e)
                            .setDescription(readmeText.length > 2000
                            ? `${readmeText.substring(0, 2000)}...\n\n[View full README](${repoData.html_url}#readme)`
                            : readmeText);
                        await interaction.editReply({ embeds: [repoEmbed, readmeEmbed] });
                    }
                    catch (error) {
                        const readmeEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`README for ${repoData.full_name}`)
                            .setColor(0x24292e)
                            .setDescription(`No README found or it couldn't be loaded. [View repository](${repoData.html_url})`);
                        await interaction.editReply({ embeds: [repoEmbed, readmeEmbed] });
                    }
                    break;
                }
                case "view_languages": {
                    try {
                        const languagesResponse = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repoName}/languages`, {
                            headers: {
                                "User-Agent": "DiscordBot (https://github.com)",
                            },
                        });
                        const languages = languagesResponse.data;
                        const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
                        const languagesEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`Languages used in ${repoData.name}`)
                            .setColor(0x24292e)
                            .setDescription(Object.entries(languages)
                            .map(([lang, bytes]) => {
                            const percentage = ((bytes / totalBytes) * 100).toFixed(2);
                            return `\`${lang}\`: ${percentage}% (${bytes.toLocaleString()} bytes)`;
                        })
                            .join("\n"));
                        await interaction.editReply({ embeds: [repoEmbed, languagesEmbed] });
                    }
                    catch (error) {
                        console.error("Error fetching languages:", error);
                        await interaction.editReply({ embeds: [repoEmbed] });
                    }
                    break;
                }
            }
            return;
        });
        // Handle branch selection
        const selectCollector = msg.createMessageComponentCollector({
            time: 60000,
            componentType: discord_js_1.ComponentType.StringSelect,
        });
        selectCollector.on("collect", async (interaction) => {
            if (!interaction.isStringSelectMenu())
                return;
            await interaction.deferUpdate();
            const selectedBranch = interaction.values[0];
            const branchEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`Branch ${selectedBranch} of ${repoData.full_name}`)
                .setColor(0x24292e)
                .setDescription(`[View branch tree](${repoData.html_url}/tree/${selectedBranch})`);
            await interaction.editReply({ embeds: [repoEmbed, branchEmbed] });
        });
        collector.on("end", () => {
            msg.edit({ components: [] }).catch(console.error);
        });
        selectCollector.on("end", () => {
            msg.edit({ components: [] }).catch(console.error);
        });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            return message.reply(`GitHub repository "${repoPath}" not found.`);
        }
        console.error("Error fetching GitHub repository:", error);
        return message.reply("An error occurred while fetching GitHub repository information.");
    }
    return;
}
async function handleSearch(message, query) {
    try {
        const response = await axios_1.default.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`, {
            headers: {
                "User-Agent": "DiscordBot (https://github.com)",
            },
        });
        const searchData = response.data;
        if (searchData.total_count === 0) {
            return message.reply(`No repositories found for query "${query}"`);
        }
        const searchEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`GitHub Search: "${query}"`)
            .setColor(0x24292e)
            .setDescription(`Found ${searchData.total_count} repositories. Showing top ${searchData.items.length} results.`)
            .addFields(searchData.items.map((item) => ({
            name: item.full_name,
            value: `${item.description || "No description"}\n⭐ ${item.stargazers_count} | 🍴 ${item.forks_count} | ${item.language || "No language"}\n[View Repository](${item.html_url})`,
            inline: false,
        })));
        // Create select menu with search results
        const searchSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("select_repo")
            .setPlaceholder("Select a repository for more details")
            .addOptions(searchData.items.map((item) => ({
            label: item.full_name,
            value: item.full_name,
            description: `${item.stargazers_count} stars | ${item.language || "No language"}`,
        }))));
        const msg = await message.reply({
            embeds: [searchEmbed],
            components: [searchSelect],
        });
        // Handle repository selection
        const collector = msg.createMessageComponentCollector({
            time: 60000,
            componentType: discord_js_1.ComponentType.StringSelect,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction.isStringSelectMenu())
                return;
            await interaction.deferUpdate();
            const selectedRepo = interaction.values[0];
            return handleRepository(message, selectedRepo);
        });
        collector.on("end", () => {
            msg.edit({ components: [] }).catch(console.error);
        });
    }
    catch (error) {
        console.error("Error searching GitHub:", error);
        return message.reply("An error occurred while searching GitHub.");
    }
    return;
}
////*********************** FUNCTIONS SERVERINFO  **********************////
async function createMainEmbed(guild) {
    return new discord_js_1.EmbedBuilder()
        .setTitle(`📊 ${guild.name} - Server Information`)
        .setColor(guild.roles.highest.color || 0x0099ff)
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .setDescription(guild.description || "No description")
        .addFields({ name: "🆔 ID", value: guild.id, inline: true }, { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true }, {
        name: "📅 Created",
        value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:D>`,
        inline: true,
    }, {
        name: "🌍 Region",
        value: guild.preferredLocale || "Auto",
        inline: true,
    }, {
        name: "🔞 NSFW Level",
        value: `${await translateNSFWLevel(guild.nsfwLevel)}`,
        inline: true,
    }, {
        name: "🛡️ Verification Level",
        value: `${await translateVerificationLevel(guild.verificationLevel)}`,
        inline: true,
    })
        .setFooter({ text: `Server created on` })
        .setTimestamp(guild.createdAt);
}
async function createStatsEmbed(guild) {
    const onlineMembers = guild.members.cache.filter((m) => m.presence?.status === "online").size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    return new discord_js_1.EmbedBuilder().setColor(guild.roles.highest.color || 0x0099ff).addFields({
        name: "👥 Members",
        value: `Total: ${guild.memberCount}\nHumans: ${guild.memberCount - bots}\nBots: ${bots}\nOnline: ${onlineMembers}`,
        inline: true,
    }, {
        name: "📊 Channels",
        value: `Total: ${guild.channels.cache.size}\nText: ${guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildText).size}\nVoice: ${guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildVoice).size}\nCategories: ${guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildCategory).size}`,
        inline: true,
    }, {
        name: "⚙️ Settings",
        value: `Boost Level: ${guild.premiumTier}\nBoosts: ${guild.premiumSubscriptionCount}\nContent Filter: ${await translateContentFilter(guild.explicitContentFilter)}\nNotifications: ${await translateNotificationLevel(guild.defaultMessageNotifications)}`,
        inline: true,
    });
}
async function createComponents() {
    const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("view_roles").setLabel("View Roles").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("view_emojis").setLabel("View Emojis").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("view_features").setLabel("View Features").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("view_bans").setLabel("View Bans").setStyle(discord_js_1.ButtonStyle.Danger));
    const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder().setCustomId("serverinfo_select").setPlaceholder("Select more information").addOptions({
        label: "Boost Information",
        value: "boost_info",
        description: "Shows details about the server's boosts",
    }, {
        label: "Security Settings",
        value: "security_info",
        description: "Shows the server's security settings",
    }, {
        label: "Featured Channels",
        value: "featured_channels",
        description: "Shows important channels",
    }, {
        label: "Server Widget",
        value: "widget_info",
        description: "Shows widget information",
    }));
    return { buttons, selectMenu };
}
async function createCollectors(msg, guild) {
    const buttonCollector = msg.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    const selectCollector = msg.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.StringSelect,
        time: 60000,
    });
    buttonCollector.on("collect", async (interaction) => {
        await interaction.deferUpdate();
        switch (interaction.customId) {
            case "view_roles":
                await showRoles(interaction, guild);
                break;
            case "view_emojis":
                await showEmojis(interaction, guild);
                break;
            case "view_features":
                await showFeatures(interaction, guild);
                break;
            case "view_bans":
                await showBans(interaction, guild);
                break;
        }
    });
    selectCollector.on("collect", async (interaction) => {
        await interaction.deferUpdate();
        switch (interaction.values[0]) {
            case "boost_info":
                await showBoostInfo(interaction, guild);
                break;
            case "security_info":
                await showSecurityInfo(interaction, guild);
                break;
            case "featured_channels":
                await showFeaturedChannels(interaction, guild);
                break;
            case "widget_info":
                await showWidgetInfo(interaction, guild);
                break;
        }
    });
    buttonCollector.on("end", () => msg.edit({ components: [] }).catch(() => { }));
    selectCollector.on("end", () => msg.edit({ components: [] }).catch(() => { }));
}
async function showRoles(interaction, guild) {
    const roles = guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .filter((role) => role.name !== "@everyone")
        .map((role) => role.toString())
        .join(" ") || "No roles";
    const rolesEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🧿 Roles of ${guild.name} (${guild.roles.cache.size - 1})`)
        .setColor(guild.roles.highest.color || 0x0099ff)
        .setDescription(roles.length > 2000 ? roles.substring(0, 2000) + "..." : roles);
    await interaction.editReply({ embeds: [rolesEmbed] });
}
async function showEmojis(interaction, guild) {
    const emojis = guild.emojis.cache;
    const animated = emojis.filter((e) => e.animated);
    const staticEmojis = emojis.filter((e) => !e.animated);
    const emojiList = [
        `**Animated (${animated.size}):** ${animated.map((e) => e.toString()).join(" ")}`,
        `**Static (${staticEmojis.size}):** ${staticEmojis.map((e) => e.toString()).join(" ")}`,
    ].join("\n\n");
    const emojisEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`😀 Emojis of ${guild.name} (${emojis.size})`)
        .setColor(guild.roles.highest.color || 0x0099ff)
        .setDescription(emojiList.length > 2000 ? emojiList.substring(0, 2000) + "..." : emojiList);
    await interaction.editReply({ embeds: [emojisEmbed] });
}
async function showFeatures(interaction, guild) {
    const features = guild.features;
    const featuresEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`✨ Special features of ${guild.name}`)
        .setColor(guild.roles.highest.color || 0x0099ff)
        .setDescription(features.length > 0
        ? features.map(async (f) => await translateFeature(f)).join("\n• ")
        : "This server has no special features");
    await interaction.editReply({ embeds: [featuresEmbed] });
}
async function showBans(interaction, guild) {
    try {
        const bans = await guild.bans.fetch();
        const bansEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`🚫 Bans in ${guild.name} (${bans.size})`)
            .setColor(0xff0000)
            .setDescription(bans.size > 0
            ? bans
                .map((ban) => `**${ban.user.tag}** (ID: ${ban.user.id})\nReason: ${ban.reason || "Not specified"}`)
                .join("\n\n")
                .substring(0, 2000)
            : "There are no banned users in this server");
        await interaction.editReply({ embeds: [bansEmbed] });
    }
    catch (error) {
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setTitle("❌ Error")
            .setColor(0xff0000)
            .setDescription("I don't have permission to view the ban list");
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
async function showBoostInfo(interaction, guild) {
    const boostEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🚀 Boost Information of ${guild.name}`)
        .setColor(0xff73fa)
        .addFields({ name: "Boost Level", value: `Tier ${guild.premiumTier}`, inline: true }, { name: "Boosts", value: guild.premiumSubscriptionCount?.toString() || "0", inline: true }, {
        name: "Unlocked perks",
        value: `${await getBoostBenefits(guild.premiumTier)}`,
        inline: false,
    })
        .setImage(guild.bannerURL({ size: 1024 }));
    await interaction.editReply({ embeds: [boostEmbed] });
}
async function showSecurityInfo(interaction, guild) {
    const securityEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🛡️ Security Settings of ${guild.name}`)
        .setColor(0x00ff00)
        .addFields({
        name: "Verification Level",
        value: `${await translateVerificationLevel(guild.verificationLevel)}`,
        inline: true,
    }, {
        name: "Explicit Content Filter",
        value: `${await translateContentFilter(guild.explicitContentFilter)}`,
        inline: true,
    }, { name: "NSFW Level", value: `${await translateNSFWLevel(guild.nsfwLevel)}`, inline: true }, {
        name: "Requires 2FA for moderators",
        value: guild.mfaLevel === 1 ? "✅ Yes" : "❌ No",
        inline: true,
    });
    await interaction.editReply({ embeds: [securityEmbed] });
}
async function showFeaturedChannels(interaction, guild) {
    const channels = [
        { name: "Rules", channel: guild.rulesChannel },
        { name: "System", channel: guild.systemChannel },
        { name: "AFK", channel: guild.afkChannel },
        { name: "Widget", channel: guild.widgetChannel },
        { name: "Public notifications", channel: guild.publicUpdatesChannel },
    ];
    const channelsEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`📌 Featured Channels of ${guild.name}`)
        .setColor(guild.roles.highest.color || 0x0099ff)
        .setDescription(channels.map((c) => `**${c.name}:** ${c.channel ? c.channel.toString() : "Not set"}`).join("\n"));
    await interaction.editReply({ embeds: [channelsEmbed] });
}
async function showWidgetInfo(interaction, guild) {
    const widgetEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`📊 Widget of ${guild.name}`)
        .setColor(guild.roles.highest.color || 0x0099ff)
        .addFields({ name: "Widget enabled", value: guild.widgetEnabled ? "✅ Yes" : "❌ No", inline: true }, {
        name: "Widget channel",
        value: guild.widgetChannel?.toString() || "Not set",
        inline: true,
    });
    if (guild.widgetEnabled) {
        widgetEmbed.setImage(`https://discord.com/api/guilds/${guild.id}/widget.png?style=banner2`);
    }
    await interaction.editReply({ embeds: [widgetEmbed] });
}
// Translation functions
async function translateNSFWLevel(level) {
    const levels = {
        [discord_js_1.GuildNSFWLevel.Default]: "Default",
        [discord_js_1.GuildNSFWLevel.Explicit]: "Explicit",
        [discord_js_1.GuildNSFWLevel.Safe]: "Safe",
        [discord_js_1.GuildNSFWLevel.AgeRestricted]: "Age Restricted",
    };
    return levels[level] || "Unknown";
}
async function translateVerificationLevel(level) {
    const levels = {
        [discord_js_1.GuildVerificationLevel.None]: "None",
        [discord_js_1.GuildVerificationLevel.Low]: "Low (verified email)",
        [discord_js_1.GuildVerificationLevel.Medium]: "Medium (registered for more than 5 minutes)",
        [discord_js_1.GuildVerificationLevel.High]: "High (member of the server for more than 10 minutes)",
        [discord_js_1.GuildVerificationLevel.VeryHigh]: "Very high (verified phone)",
    };
    return levels[level] || "Unknown";
}
async function translateContentFilter(filter) {
    const filters = {
        [discord_js_1.GuildExplicitContentFilter.Disabled]: "Disabled",
        [discord_js_1.GuildExplicitContentFilter.MembersWithoutRoles]: "Members without roles",
        [discord_js_1.GuildExplicitContentFilter.AllMembers]: "All members",
    };
    return filters[filter] || "Unknown";
}
async function translateNotificationLevel(level) {
    const levels = {
        [discord_js_1.GuildDefaultMessageNotifications.AllMessages]: "All messages",
        [discord_js_1.GuildDefaultMessageNotifications.OnlyMentions]: "Only mentions",
    };
    return levels[level] || "Unknown";
}
async function translateFeature(feature) {
    const features = {
        ANIMATED_BANNER: "Animated banner",
        ANIMATED_ICON: "Animated icon",
        BANNER: "Banner",
        COMMUNITY: "Community server",
        DISCOVERABLE: "Discoverable",
        FEATURABLE: "Featurable",
        INVITE_SPLASH: "Invite background",
        MEMBER_VERIFICATION_GATE_ENABLED: "Member verification enabled",
        MONETIZATION_ENABLED: "Monetization enabled",
        MORE_STICKERS: "More stickers",
        NEWS: "News channels",
        PARTNERED: "Partnered server",
        PREVIEW_ENABLED: "Preview enabled",
        PRIVATE_THREADS: "Private threads",
        ROLE_ICONS: "Role icons",
        SEVEN_DAY_THREAD_ARCHIVE: "7-day thread archive",
        THREE_DAY_THREAD_ARCHIVE: "3-day thread archive",
        TICKETED_EVENTS_ENABLED: "Ticketed events enabled",
        VANITY_URL: "Vanity URL",
        VERIFIED: "Verified server",
        VIP_REGIONS: "VIP regions",
        WELCOME_SCREEN_ENABLED: "Welcome screen enabled",
        THREADS_ENABLED: "Threads enabled",
        ENABLED_DISCOVERABLE_BEFORE: "Previously discoverable",
        TEXT_IN_VOICE_ENABLED: "Text in voice channels",
    };
    return features[feature] || feature;
}
async function getBoostBenefits(tier) {
    const benefits = {
        [discord_js_1.GuildPremiumTier.None]: "• 50 emojis\n• 128 Kbps voice quality",
        [discord_js_1.GuildPremiumTier.Tier1]: "• 100 emojis\n• 256 Kbps voice quality\n• Server banner\n• Animated icon\n• 384 Kbps live streaming",
        [discord_js_1.GuildPremiumTier.Tier2]: "• 150 emojis\n• 384 Kbps voice quality\n• Invite background\n• 50 MB max file size\n• 1080p/60fps live streaming",
        [discord_js_1.GuildPremiumTier.Tier3]: "• 250 emojis\n• 384 Kbps voice quality\n• Animated banner\n• 100 MB max file size\n• Priority in server lists",
    };
    return benefits[tier] || "No boost benefits";
}
////*********************** FUNCTIONS USERINFO  **********************////
async function getTargetUserv2(message, args) {
    // Buscar por mención
    const mention = message.mentions.users.first();
    if (mention)
        return mention;
    // Buscar por ID
    if (args[0] && /^\d{17,19}$/.test(args[0])) {
        try {
            return await message.client.users.fetch(args[0]);
        }
        catch {
            // Continuar con otros métodos
        }
    }
    // Buscar por nombre (miembros del servidor)
    if (args[0] && message.guild) {
        const searchTerm = args.join(" ");
        const members = await message.guild.members.search({ query: searchTerm, limit: 1 });
        if (members.size > 0)
            return members.first().user;
    }
    // Si no se especifica usuario, usar el autor
    return message.author;
}
async function createMainEmbedv2(user, member) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`👤 Information of ${user.username}`)
        .setColor(member?.displayColor || discord_js_1.Colors.Blue)
        .setThumbnail(user.displayAvatarURL({ size: 1024 }))
        .addFields({ name: "🆔 ID", value: user.id, inline: true }, { name: "📌 Tag", value: user.tag, inline: true }, { name: "🤖 Bot", value: user.bot ? "✅ Yes" : "❌ No", inline: true });
    // Información de creación de cuenta
    embed.addFields({
        name: "📅 Account created",
        value: `${(0, moment_1.default)(user.createdAt).format("LLL")}\n(${(0, moment_1.default)(user.createdAt).fromNow()})`,
        inline: false,
    });
    // Información de badges (insignias)
    const badges = await getUserBadges(user.flags);
    if (badges.length > 0) {
        embed.addFields({ name: "🏅 Badges", value: badges.join(" "), inline: false });
    }
    return embed;
}
async function createStatusEmbed(_user, member) {
    const embed = new discord_js_1.EmbedBuilder().setColor(member?.displayColor || discord_js_1.Colors.Blue);
    if (member) {
        // Información específica del miembro en el servidor
        embed.addFields({
            name: "📅 Joined the server",
            value: `${(0, moment_1.default)(member.joinedAt).format("LLL")}\n(${(0, moment_1.default)(member.joinedAt).fromNow()})`,
            inline: true,
        }, {
            name: "🎭 Nickname",
            value: member.nickname || "None",
            inline: true,
        }, {
            name: "👑 Roles",
            value: member.roles.cache.size > 1 ? `${member.roles.cache.size - 1} roles` : "No additional roles",
            inline: true,
        });
        // Estado y actividad
        const status = member.presence?.status || "offline";
        const activities = member.presence?.activities || [];
        embed.addFields({
            name: "🟢 Status",
            value: `${await translateStatus(status)}`,
            inline: true,
        });
        if (activities.length > 0) {
            const activity = activities[0];
            let activityText = `**${await translateActivityType(activity.type)} ${activity.name}**`;
            if (activity.details)
                activityText += `\n> ${activity.details}`;
            if (activity.state)
                activityText += `\n> ${activity.state}`;
            embed.addFields({
                name: "🎮 Activity",
                value: activityText,
                inline: false,
            });
        }
    }
    else {
        embed.setDescription("This user is not in this server.");
    }
    return embed;
}
async function createComponentsv2(user, member) {
    const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel("Full Avatar")
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(user.displayAvatarURL({ size: 4096 })), new discord_js_1.ButtonBuilder()
        .setCustomId("view_roles")
        .setLabel("View Roles")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(!member), new discord_js_1.ButtonBuilder().setCustomId("view_badges").setLabel("View Badges").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("view_permissions")
        .setLabel("View Permissions")
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setDisabled(!member));
    const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("userinfo_select")
        .setPlaceholder("More information...")
        .addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel("Account Information")
        .setValue("account_info")
        .setDescription("Shows account details"), new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel("Activities")
        .setValue("activities")
        .setDescription("Shows current activities")
        .setDefault(!member?.presence), new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel("Username History")
        .setValue("username_history")
        .setDescription("Shows previous usernames"), new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel("Profile Banner")
        .setValue("profile_banner")
        .setDescription("Shows profile banner")));
    return { buttons, selectMenu };
}
async function createCollectorsv2(msg, user, member) {
    const buttonCollector = msg.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    const selectCollector = msg.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.StringSelect,
        time: 60000,
    });
    buttonCollector.on("collect", async (interaction) => {
        await interaction.deferUpdate();
        switch (interaction.customId) {
            case "view_roles":
                await showRolesv2(interaction, member);
                break;
            case "view_badges":
                await showBadges(interaction, user);
                break;
            case "view_permissions":
                await showPermissions(interaction, member);
                break;
        }
    });
    selectCollector.on("collect", async (interaction) => {
        await interaction.deferUpdate();
        switch (interaction.values[0]) {
            case "account_info":
                await showAccountInfo(interaction, user, member);
                break;
            case "activities":
                await showActivities(interaction, member);
                break;
            case "username_history":
                await showUsernameHistory(interaction, user);
                break;
            case "profile_banner":
                await showProfileBanner(interaction, user);
                break;
        }
    });
    buttonCollector.on("end", () => msg.edit({ components: [] }).catch(() => { }));
    selectCollector.on("end", () => msg.edit({ components: [] }).catch(() => { }));
}
// Funciones para mostrar información específica
async function showRolesv2(interaction, member) {
    const roles = member.roles.cache
        .sort((a, b) => b.position - a.position)
        .filter((role) => role.name !== "@everyone")
        .map((role) => role.toString());
    const rolesEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🧿 Roles of ${member.user.username} (${roles.length})`)
        .setColor(member.displayColor || discord_js_1.Colors.Blue)
        .setDescription(roles.length > 0 ? roles.join(" ") : "No additional roles");
    await interaction.editReply({ embeds: [rolesEmbed] });
}
async function showBadges(interaction, user) {
    const flags = user.flags?.toArray() || [];
    const premiumSince = user.premiumSince; // Para nitro boosting
    const badgesEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🏅 Badges of ${user.username}`)
        .setColor(discord_js_1.Colors.Gold)
        .setDescription(flags.length > 0 || premiumSince
        ? `${(await getDetailedBadges(user.flags, premiumSince)).join("\n")}`
        : "No special badges");
    await interaction.editReply({ embeds: [badgesEmbed] });
}
async function showPermissions(interaction, member) {
    const permissions = member.permissions.toArray();
    const importantPermissions = [
        "Administrator",
        "ManageGuild",
        "ManageRoles",
        "ManageChannels",
        "KickMembers",
        "BanMembers",
        "ManageMessages",
        "MentionEveryone",
        "ManageNicknames",
        "ManageEmojisAndStickers",
        "ModerateMembers",
    ];
    const permissionsEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🛡️ Permissions of ${member.user.username}`)
        .setColor(discord_js_1.Colors.Red)
        .addFields({
        name: "Important Permissions",
        value: permissions
            .filter((p) => importantPermissions.includes(p))
            .map(async (p) => `• ${await translatePermission(p)}`)
            .join("\n") || "None",
        inline: true,
    }, {
        name: "Other Permissions",
        value: permissions
            .filter((p) => !importantPermissions.includes(p))
            .map(async (p) => `• ${await translatePermission(p)}`)
            .join("\n") || "None",
        inline: true,
    });
    await interaction.editReply({ embeds: [permissionsEmbed] });
}
async function showAccountInfo(interaction, user, member) {
    const accountEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🔐 Account Information of ${user.username}`)
        .setColor(discord_js_1.Colors.DarkBlue)
        .addFields({ name: "🆔 ID", value: user.id, inline: true }, { name: "📌 Tag", value: user.tag, inline: true }, { name: "🤖 Bot", value: user.bot ? "✅ Yes" : "❌ No", inline: true }, {
        name: "📅 Account Created",
        value: `${(0, moment_1.default)(user.createdAt).format("LLL")}\n(${(0, moment_1.default)(user.createdAt).fromNow()})`,
        inline: false,
    });
    if (member) {
        accountEmbed.addFields({
            name: "📅 Joined Server",
            value: `${(0, moment_1.default)(member.joinedAt).format("LLL")}\n(${(0, moment_1.default)(member.joinedAt).fromNow()})`,
            inline: false,
        });
    }
    if (user.hexAccentColor) {
        accountEmbed.addFields({
            name: "🎨 Accent Color",
            value: `#${user.hexAccentColor}`,
            inline: true,
        });
    }
    await interaction.editReply({ embeds: [accountEmbed] });
}
async function showActivities(interaction, member) {
    const activities = member.presence?.activities || [];
    if (activities.length === 0) {
        const noActivitiesEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`🎮 Activities of ${member.user.username}`)
            .setColor(discord_js_1.Colors.Purple)
            .setDescription("Not currently engaged in any activities.");
        return interaction.editReply({ embeds: [noActivitiesEmbed] });
    }
    const activitiesEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🎮 Activities of ${member.user.username} (${activities.length})`)
        .setColor(discord_js_1.Colors.Purple);
    for (const activity of activities) {
        let activityText = `**Type:** ${await translateActivityType(activity.type)}\n`;
        if (activity.name)
            activityText += `**Name:** ${activity.name}\n`;
        if (activity.details)
            activityText += `**Details:** ${activity.details}\n`;
        if (activity.state)
            activityText += `**State:** ${activity.state}\n`;
        if (activity.timestamps?.start) {
            activityText += `**Started:** ${(0, moment_1.default)(activity.timestamps.start).fromNow()}\n`;
        }
        if (activity.assets?.largeText) {
            activityText += `**Resource:** ${activity.assets.largeText}\n`;
        }
        activitiesEmbed.addFields({
            name: activity.name || "Activity",
            value: activityText,
            inline: false,
        });
    }
    await interaction.editReply({ embeds: [activitiesEmbed] });
}
async function showUsernameHistory(interation, user) {
    // Nota: Discord no proporciona un historial de nombres de usuario a través de la API
    // Esto es solo un marcador de posición para una posible implementación con una base de datos
    const historyEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`📜 Username history of ${user.username}`)
        .setColor(discord_js_1.Colors.LuminousVividPink)
        .setDescription("Discord does not provide a username history through the API. This feature would require an external tracking system.");
    await interation.editReply({ embeds: [historyEmbed] });
}
async function showProfileBanner(interaction, user) {
    try {
        const fullUser = await user.fetch();
        const bannerURL = fullUser.bannerURL({ size: 1024 });
        if (bannerURL) {
            const bannerEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`🖼️ Profile banner of ${user.username}`)
                .setImage(bannerURL)
                .setColor(discord_js_1.Colors.Gold);
            await interaction.editReply({ embeds: [bannerEmbed] });
        }
        else {
            const noBannerEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`🖼️ Profile banner of ${user.username}`)
                .setDescription("This user does not have a profile banner.")
                .setColor(discord_js_1.Colors.Gold);
            await interaction.editReply({ embeds: [noBannerEmbed] });
        }
    }
    catch (error) {
        console.error("Error fetching user banner:", error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("Could not retrieve profile banner information.")
            .setColor(discord_js_1.Colors.Red);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
// Funciones de utilidad
async function getUserBadges(flags) {
    if (!flags)
        return [];
    const badgeEmojis = {
        ActiveDeveloper: "<:activedeveloper:1041819477491523624>",
        BugHunterLevel1: "<:bughunter_1:847477570382168104>",
        BugHunterLevel2: "<:bughunter_2:847477570453897246>",
        PremiumEarlySupporter: "<:earlysupporter:847477570384003102>",
        Partner: "<:partner:847477570347433994>",
        Staff: "<:staff:847477570341765160>",
        HypeSquadOnlineHouse1: "<:hypesquad_bravery:847477570407006258>",
        HypeSquadOnlineHouse2: "<:hypesquad_brilliance:847477570453897227>",
        HypeSquadOnlineHouse3: "<:hypesquad_balance:847477570430894090>",
        Hypesquad: "<:hypesquad_events:847477570430894101>",
        CertifiedModerator: "<:certified_moderator:911593829038850108>",
        VerifiedDeveloper: "<:verifiedbotdeveloper:847477570430894080>",
        VerifiedBot: "<:verified_bot:847477570430894091>",
        BotHTTPInteractions: "<:bot:847477570430894092>",
        Quarantined: "🚫",
        Spammer: "✉️",
        DisablePremium: "⌛",
    };
    return flags.toArray().map((flag) => badgeEmojis[flag] || flag);
}
async function getDetailedBadges(flags, premiumSince) {
    if (!flags)
        return [];
    const badgeDescriptions = {
        ActiveDeveloper: "**Active Developer** - Active contributor in the Discord developer program",
        BugHunterLevel1: "**Bug Hunter (Level 1)** - Reported critical bugs in Discord",
        BugHunterLevel2: "**Bug Hunter (Level 2)** - Reported exceptional bugs in Discord",
        PremiumEarlySupporter: "**Early Supporter** - Supported Discord in its early days",
        Partner: "**Discord Partner** - Official Discord partner",
        Staff: "**Discord Staff** - Member of the Discord team",
        HypeSquadOnlineHouse1: "**HypeSquad Bravery** - Member of the Bravery house",
        HypeSquadOnlineHouse2: "**HypeSquad Brilliance** - Member of the Brilliance house",
        HypeSquadOnlineHouse3: "**HypeSquad Balance** - Member of the Balance house",
        Hypesquad: "**HypeSquad Events** - Participant in HypeSquad events",
        CertifiedModerator: "**Certified Moderator** - Certified Discord moderator",
        VerifiedDeveloper: "**Verified Developer** - Verified bot developer",
        VerifiedBot: "**Verified Bot** - Bot verified by Discord",
        BotHTTPInteractions: "**Bot** - Discord bot application",
        Quarantined: "**Quarantine** - The account has been quarantined",
        Spammer: "**Spammer** - Marked as spammer",
        DisablePremium: "**Nitro Revoked** - Nitro subscription revoked",
    };
    const badges = flags.toArray().map((flag) => `• ${badgeDescriptions[flag] || flag}`);
    if (premiumSince) {
        badges.unshift("• **Nitro Booster** - Boosting this server with Nitro");
    }
    return badges;
}
async function translateStatus(status) {
    const statuses = {
        online: "🟢 Online",
        idle: "🌙 Idle",
        dnd: "⛔ Do not disturb",
        offline: "⚫ Offline",
        invisible: "⚫ Offline",
    };
    return statuses[status] || status;
}
async function translateActivityType(type) {
    const types = {
        0: "Playing",
        1: "Streaming",
        2: "Listening",
        3: "Watching",
        4: "Custom",
        5: "Competing",
    };
    return types[type] || `Type ${type}`;
}
async function translatePermission(permission) {
    const permissions = {
        Administrator: "Administrator",
        ManageGuild: "Manage server",
        ManageRoles: "Manage roles",
        ManageChannels: "Manage channels",
        KickMembers: "Kick members",
        BanMembers: "Ban members",
        ManageMessages: "Manage messages",
        MentionEveryone: "Mention @everyone",
        ManageNicknames: "Manage nicknames",
        ManageEmojisAndStickers: "Manage emojis and stickers",
        ModerateMembers: "Moderate members",
    };
    return permissions[permission] || permission;
}
////**************************** EVAL COMMAND **********************************////
async function parseInput(args) {
    const flags = {
        async: false,
        deep: false,
        full: false,
        hidden: false,
    };
    // Filter out flags
    const filteredArgs = args.filter((arg) => {
        if (arg.startsWith("--")) {
            const flag = arg.slice(2).toLowerCase();
            if (flag in flags) {
                flags[flag] = true;
                return false;
            }
        }
        return true;
    });
    return {
        flags,
        code: filteredArgs.join(" "),
    };
}
async function createEvalContext(client, message) {
    return {
        client,
        message,
        channel: message.channel,
        guild: message.guild,
        author: message.author,
        member: message.member,
        // Utility functions
        sleep,
        fetch: require("node-fetch"),
        // Libraries
        _: require("lodash"),
        moment: require("moment"),
        axios: require("axios"),
        // Discord.js
        Discord: require("discord.js"),
        // Shortcuts
        db: client.db,
        config: client.config,
    };
}
async function createDebugInfo(data) {
    const timestamp = (0, date_fns_1.format)(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");
    const memoryUsage = process.memoryUsage();
    return [
        `=== Evaluation Debug Information ===`,
        `Timestamp: ${timestamp}`,
        `Execution Time: ${data.executionTimeMs.toFixed(3)}ms (${data.executionTimeSec})`,
        `Code Hash: ${(0, crypto_1.createHash)("sha256").update(data.code).digest("hex").slice(0, 8)}`,
        `Output Type: ${data.type}`,
        `Flags: ${JSON.stringify(data.flags)}`,
        `User: ${data.user.tag} (${data.user.id})`,
        `Channel: #${data.channel.name} (${data.channel.id})`,
        `Guild: ${data.guild.name} (${data.guild.id})`,
        `=== Memory Usage ===`,
        `RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        `Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        `Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        `=== Code (${data.code.length} chars) ===`,
        data.code.length > MAX_DEBUG_INFO_LENGTH ? data.code.substring(0, MAX_DEBUG_INFO_LENGTH) + "..." : data.code,
        `=== Output Preview (${data.output.length} chars) ===`,
        data.output.length > MAX_DEBUG_INFO_LENGTH ? data.output.substring(0, MAX_DEBUG_INFO_LENGTH) + "..." : data.output,
    ].join("\n");
}
async function sendResponse(message, data) {
    const { code, output, debugInfo, executionTimeMs, executionTimeSec, type, evaluated, flags } = data;
    // Create file attachments if needed
    const files = [];
    let outputContent = output;
    //let debugContent = debugInfo;
    if (output.length > MAX_OUTPUT_LENGTH || flags.hidden) {
        const outputFileName = `eval-output-${Date.now()}.txt`;
        files.push(new discord_js_1.AttachmentBuilder(Buffer.from(output), { name: outputFileName }));
        outputContent = `Output is too large (${output.length} chars). See attached file.`;
    }
    if (debugInfo.length > MAX_DEBUG_INFO_LENGTH) {
        const debugFileName = `eval-debug-${Date.now()}.txt`;
        files.push(new discord_js_1.AttachmentBuilder(Buffer.from(debugInfo), { name: debugFileName }));
        //debugContent = `Debug info is too large. See attached file.`;
    }
    // Create embed
    const embed = new embeds_extend_1.EmbedCorrect()
        .setTitle("✅ Evaluation Successful")
        .setColor(0x00ff00)
        .addFields({
        name: "📥 Input Code",
        value: (0, discord_js_1.codeBlock)("js", code.length > 500 ? code.substring(0, 500) + "..." : code),
    }, {
        name: "📤 Result",
        value: (0, discord_js_1.codeBlock)("js", outputContent),
    }, {
        name: "⏱️ Performance",
        value: `**Time:** ${executionTimeMs.toFixed(3)}ms (${executionTimeSec})\n` + `**Type:** \`${type}\``,
        inline: true,
    }, {
        name: "📊 Context",
        value: `**User:** ${message.author.tag}\n` + `**Channel:** ${message.channel.name}`,
        inline: true,
    });
    if (flags.hidden) {
        embed.setDescription("🔒 **Hidden Output** - Result sent as file attachment");
    }
    // Create components
    const components = [];
    // Action buttons
    const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`eval-delete-${message.author.id}`).setLabel("Delete").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId(`eval-json-${message.author.id}`)
        .setLabel("View as JSON")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(typeof evaluated !== "object"), new discord_js_1.ButtonBuilder()
        .setCustomId(`eval-raw-${message.author.id}`)
        .setLabel("View Raw")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    components.push(actionRow);
    // Debug info in a select menu
    if (!flags.hidden) {
        const debugRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`eval-debug-${message.author.id}`)
            .setPlaceholder("View debug options...")
            .addOptions({
            label: "Show Debug Info",
            value: "show_debug",
            description: "View detailed debug information",
        }, {
            label: "Show Memory Usage",
            value: "show_memory",
            description: "View process memory information",
        }, {
            label: "Show Full Code",
            value: "show_code",
            description: "View complete evaluated code",
        }));
        components.push(debugRow);
    }
    // Send the message
    const sentMessage = await message.channel.send({
        embeds: [embed],
        files,
        components,
    });
    // Set up collectors for interactivity
    await setupCollectors(sentMessage, {
        originalOutput: output,
        debugInfo,
        code,
        executionTimeMs,
        type,
        evaluated,
        flags,
    });
}
async function setupCollectors(message, data) {
    const buttonCollector = message.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    const selectCollector = message.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.StringSelect,
        time: 60000,
    });
    buttonCollector.on("collect", async (interaction) => {
        if (!interaction.isButton())
            return;
        if (!interaction.customId.includes(interaction.user.id)) {
            return interaction.reply({
                content: "❌ You didn't execute this command.",
                flags: "Ephemeral",
            });
        }
        await interaction.deferUpdate();
        const action = interaction.customId.split("-")[1];
        switch (action) {
            case "delete":
                await message.delete().catch(() => { });
                break;
            case "json":
                try {
                    const json = JSON.stringify(data.evaluated, null, 2);
                    await interaction.followUp({
                        content: (0, discord_js_1.codeBlock)("json", json.length > 1500 ? json.substring(0, 1500) + "..." : json),
                        flags: "Ephemeral",
                    });
                }
                catch (e) {
                    await interaction.followUp({
                        content: "❌ Could not stringify result as JSON",
                        flags: "Ephemeral",
                    });
                }
                break;
            case "raw":
                await interaction.followUp({
                    content: (0, discord_js_1.codeBlock)("", data.originalOutput.length > 1500 ? data.originalOutput.substring(0, 1500) + "..." : data.originalOutput),
                    flags: "Ephemeral",
                });
                break;
        }
    });
    selectCollector.on("collect", async (interaction) => {
        if (!interaction.isStringSelectMenu())
            return;
        if (!interaction.customId.includes(interaction.user.id)) {
            return interaction.reply({
                content: "❌ You didn't execute this command.",
                ephemeral: true,
            });
        }
        await interaction.deferUpdate();
        switch (interaction.values[0]) {
            case "show_debug":
                await interaction.followUp({
                    content: (0, discord_js_1.codeBlock)("", data.debugInfo.length > 1500 ? data.debugInfo.substring(0, 1500) + "..." : data.debugInfo),
                    ephemeral: true,
                });
                break;
            case "show_memory":
                const memoryUsage = process.memoryUsage();
                const memoryInfo = [
                    `=== Memory Usage ===`,
                    `RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                    `Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    `Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    `External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
                    `Array Buffers: ${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
                ].join("\n");
                await interaction.followUp({
                    content: (0, discord_js_1.codeBlock)("", memoryInfo),
                    ephemeral: true,
                });
                break;
            case "show_code":
                await interaction.followUp({
                    content: (0, discord_js_1.codeBlock)("js", data.code.length > 1500 ? data.code.substring(0, 1500) + "..." : data.code),
                    ephemeral: true,
                });
                break;
        }
    });
    buttonCollector.on("end", () => message.edit({ components: [] }).catch(() => { }));
    selectCollector.on("end", () => message.edit({ components: [] }).catch(() => { }));
}
async function sendError(message, error, prefix, code) {
    const errorEmbed = new embeds_extend_1.ErrorEmbed()
        .setError(true)
        .setTitle("❌ Evaluation Error")
        .setDescription([
        `${emojis_json_1.default.error} **An error occurred while evaluating the code.**`,
        `> **Correct Usage:** \`${prefix}eval <code>\``,
    ].join("\n"))
        .addFields({
        name: "⚠️ Error Message",
        value: (0, discord_js_1.codeBlock)("js", error.message || "Unknown error"),
    });
    if (code) {
        errorEmbed.addFields({
            name: "📝 Evaluated Code",
            value: (0, discord_js_1.codeBlock)("js", code.length > 500 ? code.substring(0, 500) + "..." : code),
        });
    }
    if (error.stack) {
        const stack = error.stack.toString();
        const stackAttachment = new discord_js_1.AttachmentBuilder(Buffer.from(stack), {
            name: `error-stack-${Date.now()}.txt`,
        });
        return message.channel.send({
            embeds: [errorEmbed],
            files: stack.length > 1000 ? [stackAttachment] : [],
        });
    }
    return message.channel.send({ embeds: [errorEmbed] });
}
//# sourceMappingURL=functions.js.map
//# debugId=9b53748c-e1a1-59f5-b272-06f946a56887
