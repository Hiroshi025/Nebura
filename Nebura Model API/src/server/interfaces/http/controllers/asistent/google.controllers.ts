import { Response } from "express";
import multer from "multer";

import { GeminiService } from "@/server/domain/services/asistent/google.service";
import { AuthenticatedRequest } from "@/typings/package/gemini.interface";

const upload = multer();
const geminiService = new GeminiService();

export class GeminiController {
    static async processText(req: AuthenticatedRequest, res: Response) {
        try {
            const { text, systemInstruction } = req.body as {
                text: string;
                systemInstruction?: string;
            };

            const result = await geminiService.processText(text, {
                apiKey: req.geminiConfig!.apiKey,
                model: req.geminiConfig!.model,
                systemInstruction,
                apiKeyHash: req.geminiConfig!.apiKeyHash
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to process text' });
        }
    }

    static async processFile(req: AuthenticatedRequest, res: Response) {
        try {
            upload.single('file')(req, res, async (err: any) => {
                if (err) {
                    return res.status(400).json({ error: 'File upload failed' });
                }

                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                const { text, systemInstruction } = req.body as {
                    text?: string;
                    systemInstruction?: string;
                };

                const result = await geminiService.processFile(
                    req.file.buffer,
                    req.file.mimetype,
                    text || "Default text",
                    {
                        apiKey: req.geminiConfig!.apiKey,
                        model: req.geminiConfig!.model,
                        systemInstruction,
                        apiKeyHash: req.geminiConfig!.apiKeyHash
                    }
                );

                return res.status(200).json(result);
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to process file' });
        }
    }

    static async processCombined(req: AuthenticatedRequest, res: Response) {
        try {
            upload.single('file')(req, res, async (err: any) => {
                if (err) {
                    return res.status(400).json({ error: 'File upload failed' });
                }

                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                const { text, systemInstruction } = req.body as {
                    text: string;
                    systemInstruction?: string;
                };

                const result = await geminiService.processCombined(
                    text,
                    req.file.buffer,
                    req.file.mimetype,
                    {
                        apiKey: req.geminiConfig!.apiKey,
                        model: req.geminiConfig!.model,
                        systemInstruction,
                        apiKeyHash: req.geminiConfig!.apiKeyHash
                    }
                );

                return res.status(200).json(result);
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to process combined request' });
        }
    }
}