"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    genAI;
    async processText(text, options) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(options.apiKey);
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
    async processFile(file, mimeType, promptText, options) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(options.apiKey);
        const model = this.genAI.getGenerativeModel({
            model: options.model,
            systemInstruction: options.systemInstruction,
        });
        const fileData = {
            inlineData: { data: file.toString("base64"), mimeType },
            // Removed mimeType as it is not valid for InlineDataPart
        };
        const contents = [
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
    async processCombined(text, file, _mimeType, options) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(options.apiKey);
        const model = this.genAI.getGenerativeModel({
            model: options.model,
            systemInstruction: options.systemInstruction,
        });
        const fileData = {
            inlineData: { data: file.toString("base64"), mimeType: "application/octet-stream" },
        };
        const contents = [
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
exports.GeminiService = GeminiService;
