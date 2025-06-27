"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="e13dbce0-8082-5194-a8eb-fdfb62029ef5")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiController = void 0;
const multer_1 = __importDefault(require("multer"));
const google_service_1 = require("../../../../application/services/asistent/google.service");
const upload = (0, multer_1.default)();
/**
 * Controller for handling Google Gemini Assistant requests.
 *
 * Provides endpoints for processing text, files, and combined text-file requests
 * using the GeminiService. Handles file uploads via multer and expects authentication
 * and Gemini configuration to be present in the request.
 *
 * @example
 * // Usage with Express:
 * app.post('/api/gemini/text', GeminiController.processText);
 * app.post('/api/gemini/file', GeminiController.processFile);
 * app.post('/api/gemini/combined', GeminiController.processCombined);
 */
class GeminiController extends google_service_1.GeminiService {
    constructor() {
        super();
    }
    /**
     * Processes a text-only request using the GeminiService.
     *
     * Expects `text` and optionally `systemInstruction` in the request body.
     * Uses Gemini configuration from the authenticated request.
     *
     * @param req - AuthenticatedRequest containing text and Gemini config.
     * @param res - Express Response object.
     *
     * @example
     * // Request body:
     * // { "text": "Hello, Gemini!", "systemInstruction": "Be concise." }
     */
    static async processText(req, res) {
        try {
            const { text, systemInstruction } = req.body;
            const result = await this.prototype.textGoogle(text, {
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
    /**
     * Processes a file upload request using the GeminiService.
     *
     * Expects a file in the `file` field of the multipart form-data and optionally
     * `text` and `systemInstruction` in the body. Uses Gemini configuration from the authenticated request.
     *
     * Handles file upload errors and missing file scenarios.
     *
     * @param req - AuthenticatedRequest with file and Gemini config.
     * @param res - Express Response object.
     *
     * @example
     * // Form-data:
     * // file: <uploaded file>
     * // text: "Describe this image"
     */
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
                const result = await this.prototype.fileGoogle(req.file.buffer, req.file.mimetype, text || "Default text", {
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
    /**
     * Processes a combined text and file request using the GeminiService.
     *
     * Expects a file in the `file` field and `text` in the body, along with optional
     * `systemInstruction`. Uses Gemini configuration from the authenticated request.
     *
     * Handles file upload errors and missing file scenarios.
     *
     * @param req - AuthenticatedRequest with file, text, and Gemini config.
     * @param res - Express Response object.
     *
     * @example
     * // Form-data:
     * // file: <uploaded file>
     * // text: "Analyze this document"
     */
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
                const result = await this.prototype.combinedGoogle(text, req.file.buffer, req.file.mimetype, {
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
//# sourceMappingURL=google.controllers.js.map
//# debugId=e13dbce0-8082-5194-a8eb-fdfb62029ef5
