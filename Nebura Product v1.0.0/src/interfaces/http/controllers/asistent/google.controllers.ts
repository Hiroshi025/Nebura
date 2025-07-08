import { Response } from "express";
import multer from "multer";

import { GeminiService } from "@/application/services/asistent/google.service";
import { AuthenticatedRequest } from "@typings/modules/api";

import { GoogleBody } from "../../../../typings/services/google";

const upload = multer();

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
export class GeminiController extends GeminiService {
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
  static async processText(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, systemInstruction } = req.body as GoogleBody;
      const result = await this.prototype.textGoogle(text, {
        apiKey: req.geminiConfig!.apiKey,
        model: req.geminiConfig!.model,
        systemInstruction,
        apiKeyHash: req.geminiConfig!.apiKeyHash,
      });

      return res.status(200).json(result);
    } catch (error) {
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
  static async processFile(req: AuthenticatedRequest, res: Response) {
    try {
      upload.single("file")(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ error: "File upload failed" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { text, systemInstruction } = req.body as GoogleBody;
        const result = await this.prototype.fileGoogle(
          req.file.buffer,
          req.file.mimetype,
          text || "Default text",
          {
            apiKey: req.geminiConfig!.apiKey,
            model: req.geminiConfig!.model,
            systemInstruction,
            apiKeyHash: req.geminiConfig!.apiKeyHash,
          },
        );

        return res.status(200).json(result);
      });
    } catch (error) {
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
  static async processCombined(req: AuthenticatedRequest, res: Response) {
    try {
      upload.single("file")(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ error: "File upload failed" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { text, systemInstruction } = req.body as GoogleBody;
        const result = await this.prototype.combinedGoogle(
          text,
          req.file.buffer,
          req.file.mimetype,
          {
            apiKey: req.geminiConfig!.apiKey,
            model: req.geminiConfig!.model,
            systemInstruction,
            apiKeyHash: req.geminiConfig!.apiKeyHash,
          },
        );

        return res.status(200).json(result);
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process combined request" });
    }
  }
}
