import {
	ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Locale, Message,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} from "discord.js";
import { compile } from "mathjs";

import { MyDiscord } from "@messaging/modules/discord/client";
import { createCanvas } from "@napi-rs/canvas";
import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

// Interfaces para tipos adicionales
interface PlotInput {
    plotType: string;
    cleanInput: string;
}

const plotCommand: Precommand = {
    name: "plot",
    nameLocalizations: {
        "es-ES": "graficar",
        "en-US": "plot"
    },
    description: "Graph 2D/3D functions, equation systems or datasets with interactive controls",
    descriptionLocalizations: {
        "es-ES": "Grafica funciones 2D/3D, sistemas de ecuaciones o datos con controles interactivos",
        "en-US": "Graph 2D/3D functions, equation systems or datasets with interactive controls"
    },
    examples: [
        "plot sin(x^2)",
        "plot contour x^2 + y^2",
        "plot parametric t,sin(t),cos(t)",
        "plot data 1,2 3,4 5,6"
    ],
    nsfw: false,
    category: "Math Utilities",
    owner: false,
    cooldown: 15,
    aliases: ["graph", "function", "plot3d"],
    botpermissions: ["SendMessages", "AttachFiles", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(client, message, args) {
        if (!message.guild || !message.channel?.isTextBased()) return;
        const lang = message.guild.preferredLocale;

        if (!args.length) {
            return await showPlotTypeMenu(client, message, lang);
        }

        try {
            const { plotType, cleanInput } = parseInput(args.join(" "));
            const imageBuffer = await generatePlot(plotType, cleanInput);
            return await sendPlot(client, message, imageBuffer, plotType, cleanInput, lang);
        } catch (error) {
            return await handlePlotError(client, message, error instanceof Error ? error : new Error(String(error)), lang);
        }
    },
};

// Función para parsear la entrada del usuario
function parseInput(input: string): PlotInput {
    const lowerInput = input.toLowerCase();
    let plotType = "2d";
    let cleanInput = input;

    if (lowerInput.includes("--data") || lowerInput.includes("-d")) {
        plotType = "data";
        cleanInput = input.replace(/--?\w+/g, "").trim();
    } else if (lowerInput.includes("3d") || lowerInput.includes("z=")) {
        plotType = "3d";
    } else if (lowerInput.includes("parametric")) {
        plotType = "parametric";
    }

    return { plotType, cleanInput };
}

// Función para enviar el gráfico resultante
async function sendPlot(client: MyDiscord, message: Message, imageBuffer: Buffer, plotType: string, expression: string, lang: Locale) {
    const attachment = new AttachmentBuilder(imageBuffer, { name: `${plotType}_plot.png` });

    const embed = new EmbedBuilder()
        .setTitle(client.t("discord:plot.result.title", { lng: lang, type: plotType.toUpperCase() }))
        .setColor(0x0099FF)
        .setImage(`attachment://${plotType}_plot.png`)
        .setFooter({ text: client.t("discord:plot.result.footer", { lng: lang, expression }) });

    await message.reply({
        embeds: [embed],
        files: [attachment]
    });
}

// Función para mostrar el menú de tipos de gráfico
async function showPlotTypeMenu(client: MyDiscord, message: Message, lang: Locale) {
    const embed = new EmbedCorrect()
        .setTitle(client.t("discord:plot.menu.title", { lng: lang }))
        .setDescription(client.t("discord:plot.menu.description", { lng: lang }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId('plot_type_select')
        .setPlaceholder(client.t("discord:plot.menu.placeholder", { lng: lang }))
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(client.t("discord:plot.types.2d", { lng: lang }))
                .setValue('2d')
                .setDescription(client.t("discord:plot.descriptions.2d", { lng: lang })),
            new StringSelectMenuOptionBuilder()
                .setLabel(client.t("discord:plot.types.3d", { lng: lang }))
                .setValue('3d')
                .setDescription(client.t("discord:plot.descriptions.3d", { lng: lang })),
            new StringSelectMenuOptionBuilder()
                .setLabel(client.t("discord:plot.types.parametric", { lng: lang }))
                .setValue('parametric')
                .setDescription(client.t("discord:plot.descriptions.parametric", { lng: lang })),
            new StringSelectMenuOptionBuilder()
                .setLabel(client.t("discord:plot.types.data", { lng: lang }))
                .setValue('data')
                .setDescription(client.t("discord:plot.descriptions.data", { lng: lang }))
        );

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('plot_help')
            .setLabel(client.t("discord:plot.buttons.help", { lng: lang }))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❓')
    );

    await message.reply({
        embeds: [embed],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
            buttonRow
        ]
    });
}

// Función para generar diferentes tipos de gráficos
async function generatePlot(type: string, input: string): Promise<Buffer> {
    const canvas = createCanvas(1000, 700);
    const ctx = canvas.getContext('2d');

    // Fondo y estilos
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '24px Roboto';
    ctx.textAlign = 'center';

    switch (type.toLowerCase()) {
        case '2d':
            return plot2DFunction(ctx, canvas, input);
        case '3d':
            return plot3DSurface(ctx, canvas, input);
        case 'parametric':
            return plotParametric(ctx, canvas, input);
        case 'data':
            return plotDataset(ctx, canvas, input);
        default:
            throw new Error('Unsupported plot type');
    }
}

// Función para gráficos 2D
function plot2DFunction(ctx: any, canvas: any, expression: string): Buffer {
    const padding = 50;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // Ejes
    ctx.strokeStyle = '#cdd6f4';
    ctx.lineWidth = 2;
    
    // Eje X
    ctx.beginPath();
    ctx.moveTo(padding, height / 2 + padding);
    ctx.lineTo(width + padding, height / 2 + padding);
    ctx.stroke();
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(width / 2 + padding, padding);
    ctx.lineTo(width / 2 + padding, height + padding);
    ctx.stroke();
    
    // Evaluación de la función
    const compiled = compile(expression);
    const scope = { x: 0 };
    
    ctx.strokeStyle = '#89b4fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let px = 0; px < width; px++) {
        const x = (px - width / 2) / (width / 10);
        scope.x = x;
        const y = -compiled.evaluate(scope) * (height / 10) + height / 2 + padding;
        
        if (px === 0) {
            ctx.moveTo(px + padding, y);
        } else {
            ctx.lineTo(px + padding, y);
        }
    }
    
    ctx.stroke();
    
    // Leyenda
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText(`f(x) = ${expression}`, canvas.width / 2, 40);
    
    return canvas.toBuffer('image/png');
}

// Funciones placeholder para otros tipos de gráficos
function plot3DSurface(ctx: any, canvas: any, expression: string): Buffer {
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText('3D Plot: ' + expression, canvas.width / 2, canvas.height / 2);
    return canvas.toBuffer('image/png');
}

function plotParametric(ctx: any, canvas: any, expression: string): Buffer {
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText('Parametric Plot: ' + expression, canvas.width / 2, canvas.height / 2);
    return canvas.toBuffer('image/png');
}

function plotDataset(ctx: any, canvas: any, data: string): Buffer {
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText('Data Plot: ' + data, canvas.width / 2, canvas.height / 2);
    return canvas.toBuffer('image/png');
}

// Función para manejar errores
async function handlePlotError(client: MyDiscord, message: Message, error: Error, lang: Locale) {
    const embed = new EmbedBuilder()
        .setTitle(client.t("discord:plot.error.title", { lng: lang }))
        .setColor(0xFF0000)
        .setDescription(client.t("discord:plot.error.description", { 
            lng: lang,
            error: error.message
        }))
        .addFields({
            name: client.t("discord:plot.error.examplesTitle", { lng: lang }),
            value: client.t("discord:plot.error.examples", { lng: lang })
        });

    const button = new ButtonBuilder()
        .setLabel(client.t("discord:plot.buttons.tryAgain", { lng: lang }))
        .setStyle(ButtonStyle.Primary)
        .setCustomId('plot_retry');

    await message.reply({
        embeds: [embed],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)]
    });
}

export default plotCommand;