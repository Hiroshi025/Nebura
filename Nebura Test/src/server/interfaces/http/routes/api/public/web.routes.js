"use strict";
// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const functions_1 = require("../../../../../../shared/functions");
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `/dashboard/${path}`;
exports.default = ({ app }) => {
    app.get(formatRoute("status"), async (req, res) => {
        try {
            const [serverResponse, discordResponse] = await Promise.all([
                axios_1.default.get(`${(0, functions_1.hostURL)()}/api/v1/public/status`),
                axios_1.default.get("https://discordstatus.com/api/v2/status.json")
            ]);
            if (serverResponse.status !== 200 || discordResponse.status !== 200) {
                return res.status(500).json({
                    message: "Failed to retrieve server status"
                });
            }
            return res.render("status.ejs", {
                title: "Nebura Client",
                user: req.user,
                status: serverResponse.data,
                discordStatus: discordResponse.data
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error processing requests",
                error: error.message
            });
        }
    });
};
