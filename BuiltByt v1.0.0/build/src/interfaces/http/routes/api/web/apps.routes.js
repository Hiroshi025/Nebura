"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="d8752694-e08f-56e9-b04c-c1f00a836ded")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
// Importa los tipos necesarios de Express
const main_1 = require("../../../../../main");
const formatRoute = (path) => `/dashboard/utils-clients/${path}`;
exports.default = ({ app }) => {
    console.debug("[apps.routes] Initializing routes for utils-clients");
    // Editar Discord config (solo username, avatar, activity)
    app.put(formatRoute("discord/:id"), async (req, res) => {
        console.debug("[apps.routes] PUT /discord/:id called", { params: req.params, body: req.body });
        try {
            const { id } = req.params;
            const { username, avatar, activity } = req.body;
            if (!id || typeof id !== "string") {
                console.debug("[apps.routes] Invalid or missing id param", { id });
                return res.status(400).json({ success: false, message: "ID de cliente inválido o faltante" });
            }
            if (!activity || typeof activity !== "object") {
                console.debug("[apps.routes] Activity missing or not an object", { activity });
                return res.status(400).json({
                    success: false,
                    message: "Actividad debe ser un objeto válido",
                });
            }
            const { status, name, url } = activity;
            if (!status || !name || !url) {
                console.debug("[apps.routes] Activity missing required fields", { activity });
                return res.status(400).json({
                    success: false,
                    message: "Actividad debe contener status, name y url",
                });
            }
            console.debug("[apps.routes] Searching discord config by clientId", id);
            const discord = await main_1.main.prisma.discord.findFirst({ where: { clientId: id } });
            if (!discord) {
                console.debug("[apps.routes] Discord config not found", { clientId: id });
                return res.status(404).json({ success: false, message: "Discord config no encontrada" });
            }
            if (!discord.activity || typeof discord.activity !== "object") {
                console.debug("[apps.routes] Discord config missing activity", { discord });
                return res.status(404).json({ success: false, message: "Discord config sin actividad" });
            }
            console.debug("[apps.routes] Updating discord config in DB", {
                id: discord.id,
                username,
                avatar,
                activity,
            });
            const updated = await main_1.main.prisma.discord.update({
                where: { id: discord.id },
                data: {
                    username: username ?? discord.username,
                    avatar: avatar ?? discord.avatar,
                    activity: activity ?? discord.activity,
                },
            });
            if (updated && main_1.client.user) {
                try {
                    console.debug("[apps.routes] Updating Discord bot user", { username, avatar, activity });
                    await main_1.client.user.setUsername(username ?? discord.username);
                    await main_1.client.user.setAvatar(avatar ?? discord.avatar);
                    await main_1.client.user.setActivity({
                        state: activity.status,
                        name: activity.name,
                        url: activity.url,
                    });
                }
                catch (botError) {
                    console.error("[apps.routes] Error updating Discord bot user", { botError });
                    // No se retorna error, solo se loguea
                }
            }
            console.debug("[apps.routes] Discord config updated successfully", { updated });
            return res.status(200).json({ success: true, message: "Discord config actualizada", data: updated });
        }
        catch (error) {
            console.error("[apps.routes] Error updating Discord config", { error: error?.stack || error });
            return res.status(500).json({
                success: false,
                message: "Error al actualizar Discord config",
                error: error?.message || "Error desconocido",
            });
        }
    });
    // Eliminar Discord config (solo username, avatar, activity)
    app.delete(formatRoute("discord/:id"), async (req, res) => {
        console.debug("[apps.routes] DELETE /discord/:id called", { params: req.params });
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                console.debug("[apps.routes] Invalid or missing id param", { id });
                return res.status(400).json({ success: false, message: "ID de discord inválido o faltante" });
            }
            console.debug("[apps.routes] Searching discord config by id", id);
            const discord = await main_1.main.prisma.discord.findUnique({ where: { id } });
            if (!discord) {
                console.debug("[apps.routes] Discord config not found for delete", { id });
                return res.status(404).json({ success: false, message: "Discord config no encontrada" });
            }
            console.debug("[apps.routes] Deleting discord config", { id });
            await main_1.main.prisma.discord.delete({ where: { id } });
            console.debug("[apps.routes] Discord config deleted", { id });
            return res.status(200).json({ success: true, message: "Discord config eliminada" });
        }
        catch (error) {
            console.error("[apps.routes] Error deleting Discord config", { error: error?.stack || error });
            return res.status(500).json({
                success: false,
                message: "Error al eliminar Discord config",
                error: error?.message || "Error desconocido",
            });
        }
    });
    app.get(formatRoute("discord/:id"), async (req, res) => {
        console.debug("[apps.routes] GET /discord/:id called", { params: req.params });
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                console.debug("[apps.routes] Invalid or missing id param", { id });
                return res.status(400).json({ success: false, message: "ID de cliente inválido o faltante" });
            }
            console.debug("[apps.routes] Searching discord config by clientId", id);
            const discord = await main_1.main.prisma.discord.findFirst({ where: { clientId: id } });
            if (!discord) {
                console.debug("[apps.routes] Discord config not found for get", { id });
                return res.status(404).json({ success: false, message: "Discord config no encontrada" });
            }
            console.debug("[apps.routes] Discord config found", { discord });
            return res.status(200).json({ success: true, data: discord });
        }
        catch (error) {
            console.error("[apps.routes] Error getting Discord config", { error: error?.stack || error });
            return res.status(500).json({
                success: false,
                message: "Error al obtener Discord config",
                error: error?.message || "Error desconocido",
            });
        }
    });
};
//# sourceMappingURL=apps.routes.js.map
//# debugId=d8752694-e08f-56e9-b04c-c1f00a836ded
