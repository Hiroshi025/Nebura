"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="e206b94b-3d44-5990-be9c-41ed33e92486")}catch(e){}}();

// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = require("../../../../../adapters/external/passport");
const config_1 = require("../../../../../shared/utils/config");
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `/dashboard/auth/${path}`;
exports.default = ({ app }) => {
    app.get(formatRoute("discord"), passport_1.passport.authenticate("discord", {
        failureRedirect: "/dashboard/logout",
    }), (_req, res) => {
        res.redirect("/dashboard");
    });
    app.get(formatRoute(""), (req, res) => {
        return res.render("authme.ejs", {
            title: config_1.config.project.name + " - Nebura",
            user: req.user,
        });
    });
    app.get(formatRoute("administrator"), async (req, res) => {
        return res.render("authme-admin.ejs", {
            title: config_1.config.project.name + " - Nebura",
            user: req.user,
        });
    });
};
//# sourceMappingURL=auth.routes.js.map
//# debugId=e206b94b-3d44-5990-be9c-41ed33e92486
