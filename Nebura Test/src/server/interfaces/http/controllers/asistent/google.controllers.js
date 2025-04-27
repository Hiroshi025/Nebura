"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiController = void 0;
const multer_1 = __importDefault(require("multer"));
const google_service_1 = require("../../../../../server/domain/services/asistent/google.service");
const upload = (0, multer_1.default)();
const geminiService = new google_service_1.GeminiService();
class GeminiController {
    static async processText(req, res) {
        try {
            const { text, systemInstruction } = req.body;
            const result = await geminiService.processText(text, {
                apiKey: req.geminiConfig.apiKey,
                model: req.geminiConfig.model,
                systemInstruction,
                apiKeyHash: req.geminiConfig.apiKeyHash,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to process text" });
        }
    }
    static async processFile(req, res) {
        try {
            upload.single("file")(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ error: "File upload failed" });
                }
                if (!req.file) {
                    return res.status(400).json({ error: "No file uploaded" });
                }
                const { text, systemInstruction } = req.body;
                const result = await geminiService.processFile(req.file.buffer, req.file.mimetype, text || "Default text", {
                    apiKey: req.geminiConfig.apiKey,
                    model: req.geminiConfig.model,
                    systemInstruction,
                    apiKeyHash: req.geminiConfig.apiKeyHash,
                });
                return res.status(200).json(result);
            });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to process file" });
        }
    }
    static async processCombined(req, res) {
        try {
            upload.single("file")(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ error: "File upload failed" });
                }
                if (!req.file) {
                    return res.status(400).json({ error: "No file uploaded" });
                }
                const { text, systemInstruction } = req.body;
                const result = await geminiService.processCombined(text, req.file.buffer, req.file.mimetype, {
                    apiKey: req.geminiConfig.apiKey,
                    model: req.geminiConfig.model,
                    systemInstruction,
                    apiKeyHash: req.geminiConfig.apiKeyHash,
                });
                return res.status(200).json(result);
            });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to process combined request" });
        }
    }
}
exports.GeminiController = GeminiController;
