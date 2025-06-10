import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GeminiOptions, GeminiResponse } from "@typings/modules/api";

export class GeminiService {
  private genAI!: GoogleGenerativeAI;

  async processText(text: string, options: GeminiOptions): Promise<GeminiResponse> {
    this.genAI = new GoogleGenerativeAI(options.apiKey);
    const model = this.genAI.getGenerativeModel({
      model: options.model,
      systemInstruction: options.systemInstruction,
    });

    const result = await model.generateContent(text);
    const responseText = await result.response.text();

    return {
      response: responseText,
      model: options.model,
      timestamp: new Date(),
      userTokenHash: options.apiKeyHash,
    };
  }

  async processFile(
    file: Buffer,
    mimeType: string,
    promptText: string,
    options: GeminiOptions,
  ): Promise<GeminiResponse> {
    this.genAI = new GoogleGenerativeAI(options.apiKey);
    const model = this.genAI.getGenerativeModel({
      model: options.model,
      systemInstruction: options.systemInstruction,
    });

    const fileData: Part = {
      inlineData: { data: file.toString("base64"), mimeType },
      // Removed mimeType as it is not valid for InlineDataPart
    };

    const contents: Part[] = [
      {
        inlineData: {
          data: Buffer.from(promptText || "Process this document").toString("base64"),
          mimeType: "text/plain",
        },
      },
      fileData,
    ];

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    return {
      response: responseText,
      model: options.model,
      timestamp: new Date(),
      userTokenHash: options.apiKeyHash,
    };
  }

  async processCombined(
    text: string,
    file: Buffer,
    mimeType: string, // quitar el guion bajo para usar el parámetro
    options: GeminiOptions,
  ): Promise<GeminiResponse> {
    this.genAI = new GoogleGenerativeAI(options.apiKey);
    const model = this.genAI.getGenerativeModel({
      model: options.model,
      systemInstruction: options.systemInstruction,
    });

    const fileData: Part = {
      inlineData: { data: file.toString("base64"), mimeType }, // usar el mimeType recibido
    };

    const contents: Part[] = [
      { inlineData: { data: Buffer.from(text).toString("base64"), mimeType: "text/plain" } },
      fileData,
    ];

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    return {
      response: responseText,
      model: options.model,
      timestamp: new Date(),
      userTokenHash: options.apiKeyHash,
    };
  }
}
