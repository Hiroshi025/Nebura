"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="08ac844d-66cd-57ad-9341-ed0c64553c26")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.Maintenance = exports.AuthPublic = void 0;
require("passport"); // <-- Esto importa las extensiones de tipos de passport
const main_1 = require("../../../../main");
const DB_1 = require("../../../../shared/class/DB");
// Extiende la interfaz Request para incluir isAuthenticated
//declare global {
//  namespace Express {
//    interface Request {
//      isAuthenticated?: () => boolean;
//    }
//  }
//}
const AuthPublic = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated())
        return res.redirect("/dashboard/auth");
    next();
};
exports.AuthPublic = AuthPublic;
const Maintenance = async (req, res, next) => {
    const data = await main_1.main.DB.findClient(DB_1.clientID);
    if (!data || data.maintenance) {
        return res.render("maintenance.ejs", {
            title: "Nebura - Mantenimiento",
            user: req.user,
        });
    }
    next();
};
exports.Maintenance = Maintenance;
//# sourceMappingURL=auth.middleware.js.map
//# debugId=08ac844d-66cd-57ad-9341-ed0c64553c26
