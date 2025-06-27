"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="c11b5572-24a1-509e-9d51-cc7804421870")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
/**
 * Service for interacting with Google Gemini Generative AI.
 *
 * Provides methods to process text, files, or a combination of both using the Gemini API.
 *
 * @see [Google Generative AI Documentation](https://ai.google.dev/)
 */
class GeminiService {
    genAI;
    /**
     * Processes a text prompt using the Gemini Generative AI model.
     *
     * @param text - The text prompt to send to the model.
     * @param options - Configuration options including API key, model, and system instructions.
     * @returns A promise that resolves to a GeminiResponse containing the model's output and metadata.
     *
     * @see [Gemini API Reference](https://ai.google.dev/api/rest/)
     *
     * @example
     * ```typescript
     * const response = await geminiService.processText("Hello, Gemini!", options);
     * ```
     */
    async textGoogle(text, options) {
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
    /**
     * Processes a file (such as a document or image) using the Gemini Generative AI model.
     *
     * The file is encoded in base64 and sent as inline data to the model, along with an optional prompt.
     *
     * @param file - The file buffer to process.
     * @param mimeType - The MIME type of the file (e.g., "application/pdf", "image/png").
     * @param promptText - Optional text prompt to provide context for the file.
     * @param options - Configuration options including API key, model, and system instructions.
     * @returns A promise that resolves to a GeminiResponse containing the model's output and metadata.
     *
     * @see [Supported File Types](https://ai.google.dev/docs/supported_files)
     *
     * @example
     * ```typescript
     * const response = await geminiService.processFile(fileBuffer, "application/pdf", "Summarize this document", options);
     * ```
     */
    async fileGoogle(file, mimeType, promptText, options) {
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
    /**
     * Processes both a text prompt and a file together using the Gemini Generative AI model.
     *
     * Useful for scenarios where the model should consider both textual and file-based input.
     *
     * @param text - The text prompt to send to the model.
     * @param file - The file buffer to process.
     * @param mimeType - The MIME type of the file.
     * @param options - Configuration options including API key, model, and system instructions.
     * @returns A promise that resolves to a GeminiResponse containing the model's output and metadata.
     *
     * @example
     * ```typescript
     * const response = await geminiService.processCombined("Analyze this image", imageBuffer, "image/png", options);
     * ```
     */
    async combinedGoogle(text, file, mimeType, // quitar el guion bajo para usar el parámetro
    options) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(options.apiKey);
        const model = this.genAI.getGenerativeModel({
            model: options.model,
            systemInstruction: options.systemInstruction,
        });
        const fileData = {
            inlineData: { data: file.toString("base64"), mimeType }, // usar el mimeType recibido
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
//# sourceMappingURL=google.service.js.map
//# debugId=c11b5572-24a1-509e-9d51-cc7804421870
