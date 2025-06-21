import axios from "axios";
import { Message } from "discord.js";

import { hostURL } from "@/shared/functions";
import { EmbedCorrect } from "@extenders/embeds.extend";
import { config } from "@utils/config";

import { MyClient } from "../client";

/**
 * 
 * Asistent function to handle messages directed at the bot
 * This function checks if the message mentions the bot and responds with AI-generated text.
 * It uses the Gemini AI model to generate a response based on the message content.
 */
export async function Asistent(message: Message, client: MyClient) {
  if (!config.modules.discord.owners.includes(message.author.id)) return;

  const clientMention = message.content.match(/<@!?(\d+)>/);
  if (!clientMention || clientMention[1] !== client.user?.id) return;

  if (!message.content.startsWith(`<@!${client.user?.id}>`) && !message.content.startsWith(`<@${client.user?.id}>`)) return;
  const response = await axios({
    method: "POST",
    baseURL: hostURL(),
    url: "/api/v1/service/google/model-ai/text",
    headers: {
      "Content-Type": "application/json",
      "x-secret-customer": process.env.CUSTOMER_SECRET,
      "x-gemini-api-key": process.env.GEMINI_KEY,
      "x-gemini-model": process.env.GEMINI_MODEL
    },
    data: {
      text: message.content.replace(`<@!${client.user?.id}>`, "").replace(`<@${client.user?.id}>`, "").trim(),
      systemInstruction: process.env.GEMINI_MODEL_INSTRUCTION,
    }
  });

  if (response.status !== 200) return;
  const responseData = response.data;
  const embed = new EmbedCorrect()
    .setTitle("Gemini AI - Asistent")
    .setDescription(`> ${responseData.response}`);

  await message.reply({ embeds: [embed] });
}