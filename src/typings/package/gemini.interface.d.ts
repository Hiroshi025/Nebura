import { Request } from "express";

export interface GeminiOptions {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  apiKeyHash?: string;
}

export interface GeminiResponse {
  response: string;
  model: string;
  timestamp: Date;
  userTokenHash?: string;
}

export interface GeminiTextRequest {
  text: string;
  systemInstruction?: string;
}

export interface GeminiFileRequest {
  file: Buffer;
  mimeType: string;
  text?: string;
  systemInstruction?: string;
}

export interface GeminiCombinedRequest {
  text: string;
  file: Buffer;
  mimeType: string;
  systemInstruction?: string;
}

export interface AuthenticatedRequest extends Request {
    geminiConfig?: {
        apiKey: string;
        model: string;
        apiKeyHash: string;
    };
}