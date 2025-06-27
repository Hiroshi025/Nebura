"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="6b64f315-5b65-56f5-9d41-2a3332af745b")}catch(e){}}();

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importStar(require("fs"));
const promises_1 = require("fs/promises");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importStar(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const stream_1 = __importDefault(require("stream"));
const auth_service_1 = require("../../../../../application/services/auth/auth.service");
const devs_controllers_1 = require("../../../../../interfaces/http/controllers/admin/devs.controllers");
const reminder_controllers_1 = require("../../../../../interfaces/http/controllers/asistent/reminder.controllers");
const tasks_controllers_1 = require("../../../../../interfaces/http/controllers/asistent/tasks.controllers");
const license_controllers_1 = require("../../../../../interfaces/http/controllers/license/license.controllers");
const notification_1 = require("../../../../../interfaces/messaging/broker/notification");
const main_1 = require("../../../../../main");
const config_1 = require("../../../../../shared/utils/config");
const token_1 = require("../../../../../shared/utils/token");
const winston_1 = require("../../../../../shared/utils/winston");
/**
 * Multer storage configuration for file uploads.
 * Files are stored in a directory based on the current date and userId.
 */
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        // Prefer req.query.userId because req.body is not available here
        const userId = req.query.userId || "unknown";
        const date = new Date().toISOString().split("T")[0];
        const uploadPath = path_1.default.join(__dirname, config_1.config.project.cdnpath ? config_1.config.project.cdnpath : "../../../../../../config/backups/cdn-client", `${date}_${userId}`);
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
/**
 * Multer middleware for handling file uploads.
 * Limits file size to 100MB.
 */
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
});
/**
 * Formats authentication routes with the correct prefix.
 * @param path - Specific endpoint path.
 * @returns The formatted full route.
 */
const formatRoute = (path) => `/dashboard/utils/${path}`;
/**
 * Registers all utility routes for the web API.
 * @param app - Express application instance.
 */
exports.default = ({ app }) => {
    const taskController = new tasks_controllers_1.TaskController();
    const reminderController = new reminder_controllers_1.ReminderController();
    const controller = new license_controllers_1.LicenseController();
    const security = new devs_controllers_1.SecurityController();
    /**
     * Creates a new license.
     * Requires authentication and admin role.
     * @route POST /dashboard/utils/licenses/
     */
    app.post(formatRoute("licenses/"), controller.create.bind(controller));
    /**
     * Updates an existing license by ID.
     * Requires authentication and admin role.
     * @route PUT /dashboard/utils/licenses/:id
     */
    app.put(formatRoute("licenses/:id"), controller.update.bind(controller));
    /**
     * Deletes an existing license by ID.
     * Requires authentication and admin role.
     * @route DELETE /dashboard/utils/licenses/:id
     */
    app.delete(formatRoute("licenses/:id"), controller.delete.bind(controller));
    /**
     * Endpoint to get all licenses.
     * Requires authentication and admin role.
     * @route GET /dashboard/utils/licenses/
     */
    app.get(formatRoute("licenses/"), controller.getAll.bind(controller));
    /**
     * Endpoint to get a specific license by ID.
     * Requires authentication.
     * @route GET /dashboard/utils/licenses/:id
     */
    app.get(formatRoute("licenses/:id"), controller.getById.bind(controller));
    /**
     * Endpoint to get all licenses associated with a specific user.
     * Requires authentication.
     * @route GET /dashboard/utils/licenses/user/:userId
     */
    app.get(formatRoute("licenses/user/:userId"), controller.getByUser.bind(controller));
    /**
     * Public endpoint to validate a license by its key.
     * Does not require authentication.
     * @route POST /dashboard/utils/licenses/validate/:key
     */
    app.post(formatRoute("licenses/validate/:key"), controller.validate.bind(controller));
    /**
     * Gets information about a specific license.
     * @route GET /dashboard/utils/licenses/info/:licenseKey
     * @param licenseKey - The key of the license to retrieve information for.
     * @returns {Object} JSON response with license information.
     */
    app.get(formatRoute("licenses/info/:licenseKey"), security.getLicenseInfo);
    /**
     * Creates a new task.
     * Requires authentication.
     * @route POST /dashboard/utils/tasks
     */
    app.post(formatRoute("tasks"), taskController.createTask.bind(taskController));
    /**
     * Gets a specific task by ID.
     * Requires authentication.
     * @route GET /dashboard/utils/tasks/:id
     */
    app.get(formatRoute("tasks/:id"), taskController.getTask.bind(taskController));
    /**
     * Gets all tasks.
     * Requires authentication.
     * @route GET /dashboard/utils/tasks
     */
    app.get(formatRoute("tasks"), taskController.getAllTasks.bind(taskController));
    /**
     * Updates a specific task by ID.
     * Requires authentication.
     * @route PATCH /dashboard/utils/tasks/:id
     */
    app.patch(formatRoute("tasks/:id"), taskController.updateTask.bind(taskController));
    /**
     * Deletes a specific task by ID.
     * Requires authentication.
     * @route DELETE /dashboard/utils/tasks/:id
     */
    app.delete(formatRoute("tasks/:id"), taskController.deleteTask.bind(taskController));
    /**
     * Gets upcoming reminders.
     * Requires authentication.
     * @route GET /dashboard/utils/reminders
     */
    app.get("reminders", reminderController.getUpReminders.bind(reminderController));
    /**
     * Endpoint for file upload.
     * @route POST /dashboard/utils/cdn
     * @param req.body.userId - The ID of the user uploading the file.
     * @param req.body.title - The title of the file.
     * @param req.file - The file to be uploaded.
     * @returns {Object} JSON response with upload status and file metadata.
     */
    app.post(formatRoute("cdn"), upload.single("file"), async (req, res) => {
        try {
            // Check if a file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }
            // Check for required fields
            if (!req.body.userId || !req.body.title) {
                // Remove the uploaded file if required fields are missing
                fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: "userId and title are required fields",
                });
            }
            // File metadata
            const fileMetadata = {
                userId: req.body.userId,
                originalName: req.file.originalname,
                fileName: req.file.filename,
                title: req.body.title,
                description: req.body.description || "",
                uploadedAt: new Date().toISOString(),
                uploadedBy: req.body.userId,
                path: req.file.path,
                size: req.file.size,
                mimeType: req.file.mimetype,
                downloadUrl: `/dashboard/utils/cdn/download/${req.body.userId}/${req.file.filename}`,
            };
            await main_1.main.prisma.fileMetadata.create({
                data: {
                    userId: fileMetadata.userId,
                    originalName: fileMetadata.originalName,
                    fileName: fileMetadata.fileName,
                    title: fileMetadata.title,
                    description: fileMetadata.description,
                    uploadedAt: new Date(fileMetadata.uploadedAt),
                    uploadedBy: fileMetadata.uploadedBy,
                    path: fileMetadata.path,
                    size: fileMetadata.size,
                    mimeType: fileMetadata.mimeType,
                    downloadUrl: fileMetadata.downloadUrl,
                },
            });
            return res.status(201).json({
                success: true,
                message: "File uploaded successfully",
                data: fileMetadata,
            });
        }
        catch (error) {
            console.error("Error uploading file:", error);
            // Delete the file if there was an error
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Endpoint to download a file.
     * @route GET /dashboard/utils/cdn/download/:userId/:fileName
     * @param userId - The ID of the user who owns the file.
     * @param fileName - The name of the file to download.
     */
    app.get(formatRoute("cdn/download/:userId/:fileName"), async (req, res) => {
        const { userId, fileName } = req.params;
        try {
            // Check if the user and file exist
            const fileMetadata = await main_1.main.prisma.fileMetadata.findFirst({
                where: {
                    userId: userId,
                    fileName: fileName,
                },
            });
            if (!fileMetadata) {
                return res.status(404).json({
                    success: false,
                    message: "File not found",
                });
            }
            // Send the file to the client
            res.removeHeader("X-Frame-Options");
            res.download(fileMetadata.path, fileMetadata.originalName);
        }
        catch (error) {
            console.error("Error downloading file:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
        return;
    });
    /**
     * Endpoint to get all files for a user.
     * @route GET /dashboard/utils/cdn/:userId
     * @param userId - The ID of the user whose files to retrieve.
     * @returns {Object} JSON response with file metadata.
     */
    app.get(formatRoute("cdn/:userId"), async (req, res) => {
        const { userId } = req.params;
        try {
            // Get all files for the user
            const files = await main_1.main.prisma.fileMetadata.findMany({
                where: {
                    userId: userId,
                },
            });
            return res.status(200).json({
                success: true,
                data: files,
            });
        }
        catch (error) {
            console.error("Error fetching files:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Endpoint to delete a file.
     * @route DELETE /dashboard/utils/cdn/:userId/:fileName
     * @param userId - The ID of the user who owns the file.
     * @param fileName - The name of the file to delete.
     * @returns {Object} JSON response with delete status.
     */
    app.delete(formatRoute("cdn/:userId/:fileName"), async (req, res) => {
        const { userId, fileName } = req.params;
        try {
            // Check if the user and file exist
            const fileMetadata = await main_1.main.prisma.fileMetadata.findFirst({
                where: {
                    userId: userId,
                    fileName: fileName,
                },
            });
            if (!fileMetadata) {
                return res.status(404).json({
                    success: false,
                    message: "File not found",
                });
            }
            // Delete the file from the file system
            if (fs_1.default.existsSync(fileMetadata.path)) {
                fs_1.default.unlinkSync(fileMetadata.path);
            }
            // Delete the file metadata from the database
            await main_1.main.prisma.fileMetadata.delete({
                where: {
                    id: fileMetadata.id,
                },
            });
            return res.status(200).json({
                success: true,
                message: "File deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting file:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Endpoint to view a file.
     * @route GET /dashboard/utils/cdn/view/:userId/:fileName
     * @param userId - The ID of the user who owns the file.
     * @param fileName - The name of the file to view.
     * @returns {Object} JSON response with file content.
     */
    app.get(formatRoute("cdn/view/:userId/:fileName"), async (req, res) => {
        const { userId, fileName } = req.params;
        console.log(req.params);
        // Find file metadata
        const fileMetadata = await main_1.main.prisma.fileMetadata.findFirst({
            where: {
                userId: userId,
                fileName: fileName,
            },
        });
        if (!fileMetadata) {
            return res.status(404).json({
                success: false,
                message: "File not savee in the database",
            });
        }
        // Use the path saved in the database
        const filePath = fileMetadata.path;
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found path",
            });
        }
        res.type(fileMetadata.mimeType);
        return res.sendFile(path_1.default.resolve(filePath), (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error sending file",
                    error: err.message,
                });
            }
            return;
        });
    });
    /*   app.get(formatRoute("cdn/share"), async (req: Request, res: Response) => {
      const { fileId, expiresAt, maxDownloads, password } = req.body;
      const url = hostURL() + `/dashboard/cdn/share/${fileId}`;
      const link = await main.prisma.sharedLinkCDN.create({
        data: {
          fileId,
          url,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          maxDownloads: maxDownloads ? Number(maxDownloads) : null,
          password: password ? password : null,
        },
      });
      res.json({ success: true, url: link.url });
    }); */
    /**
     * User registration endpoint.
     * @route POST /dashboard/utils/auth/register
     * @param req.body - User registration data.
     * @returns {Object} JSON response with registration status and user data.
     */
    app.post(formatRoute("auth/register"), async (req, res) => {
        try {
            const auth = new auth_service_1.AuthService();
            const userData = req.body;
            const result = await auth.createAuth(userData);
            if ("error" in result) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: "Error creating user",
                });
            }
            // Find the newly created user to log in
            const createdUser = await main_1.main.prisma.userAPI.findUnique({
                where: { email: userData.email },
            });
            if (!createdUser) {
                return res.status(500).json({ success: false, message: "Error al obtener usuario creado" });
            }
            req.login(createdUser, (err) => {
                if (err) {
                    // Handle error
                    return res.status(500).json({ success: false, message: "Error de sesión" });
                }
                // User saved in session, same as with Discord
                return res.json({ success: true, user: createdUser });
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "SERVER_ERROR",
                message: req.t("errors.server_error"),
            });
        }
        return;
    });
    /**
     * User login endpoint.
     * @route POST /dashboard/utils/auth/login
     * @param req.body.email - User email.
     * @param req.body.password - User password.
     * @returns {Object} JSON response with login status and user data.
     */
    app.post(formatRoute("auth/login"), async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await main_1.main.prisma.userAPI.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).render("authme.ejs", { title: "Nebura" });
            }
            const valid = await bcryptjs_1.default.compare(password, user.password);
            if (!valid) {
                return res.status(401).render("authme.ejs", { title: "Nebura" });
            }
            // Save user in session
            req.login(user, (err) => {
                if (err)
                    return res.status(500).render("authme.ejs", { title: "Nebura" });
                return res.redirect("/dashboard"); // Or wherever you want to redirect
            });
        }
        catch (err) {
            return res.status(500).render("authme.ejs", { title: "Nebura" });
        }
    });
    /**
     * Admin registration endpoint.
     * @route POST /dashboard/utils/admin/register
     * @param req.body - Admin registration data.
     * @returns {Object} JSON response with registration status and user data.
     */
    app.post(formatRoute("admin/register"), async (req, res) => {
        try {
            const allowedRoles = ["admin", "developer", "owner"];
            const auth = new auth_service_1.AuthService();
            const userData = req.body;
            const result = await auth.createAuth(userData);
            if ("error" in result) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: "Error creating user",
                });
            }
            const dataUser = await main_1.main.prisma.userAPI.findUnique({
                where: { email: userData.email },
            });
            if (!dataUser || !allowedRoles.includes(dataUser.role)) {
                return res.status(404).json({
                    success: false,
                    message: "User not found or not authorized",
                });
            }
            // --- Notificación Discord ---
            const notifier = new notification_1.Notification();
            await notifier.sendWebhookNotification("New Admin Registration", `A new admin user has been registered.\n\n**Name:** ${dataUser.name}\n**Email:** ${dataUser.email}\n**Role:** ${dataUser.role}\n**Date:** ${new Date().toISOString()}`, "#007bff", [{ name: "User ID", value: dataUser.id, inline: false }], {
                content: "🛡️ New admin registration event",
                username: "Admin Registration Bot",
            });
            return res.status(201).json({ success: true, user: result });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "SERVER_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
    /**
     * Admin login endpoint.
     * @route POST /dashboard/utils/admin/login
     * @param req.body.email - Admin email.
     * @param req.body.password - Admin password.
     * @returns {Object} JSON response with login status and user data.
     */
    app.post(formatRoute("admin/login"), async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await main_1.main.prisma.userAPI.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
                });
            }
            const valid = await (0, token_1.verified)(password, user.password);
            if (!valid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
                });
            }
            const allowedRoles = ["admin", "developer", "owner"];
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: "User not authorized",
                });
            }
            // Save user in session
            return res.status(200).json({ success: true, user });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "An unexpected error occurred",
                error: err.message || "Internal server error",
            });
        }
    });
    /**
     * Updates user information.
     * Requires authentication.
     * @route PUT /dashboard/utils/auth/update
     * @param req.body.userId - The ID of the user to update.
     * @param req.body.role - The new role for the user.
     * @returns {Object} JSON response with update status and user data.
     */
    app.put(formatRoute("auth/update"), async (req, res) => {
        try {
            const { userId, role } = req.body;
            // Check if the user exists
            const user = await main_1.main.prisma.userAPI.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }
            // Update the user
            const updatedUser = await main_1.main.prisma.userAPI.update({
                where: { id: userId },
                data: {
                    role: role || user.role, // Keep the current role if no new role is provided
                    updatedAt: new Date(),
                },
            });
            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            console.error("Error updating user:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Gets log entries from a specified log file.
     * @route GET /dashboard/utils/logs/:name
     * @param name - The name of the log file to retrieve.
     * @returns {Object} JSON response with log entries and metadata.
     */
    app.get(formatRoute("logs/:name"), async (req, res) => {
        try {
            const winston = new winston_1.WinstonLogger();
            const logName = req.params.name;
            const logPath = (0, path_1.resolve)(__dirname, winston.logDir, logName);
            const content = await (0, promises_1.readFile)(logPath, "utf8");
            // Each line is plain text, not JSON
            const entries = content.split("\n").filter(Boolean);
            res.status(200).json({
                entries,
                size: content.length,
                lastModified: (await Promise.resolve().then(() => __importStar(require("fs")))).statSync(logPath).mtime.toISOString(),
            });
        }
        catch (e) {
            res.status(404).json({ error: "Log no encontrado" });
        }
    });
    // Download log file
    /**
     * Downloads a specified log file.
     * @route GET /dashboard/utils/logs/download/:name
     * @param name - The name of the log file to download.
     */
    app.get(formatRoute("logs/download/:name"), async (req, res) => {
        try {
            const winston = new winston_1.WinstonLogger();
            const logName = req.params.name;
            const logPath = (0, path_1.resolve)(__dirname, winston.logDir, logName);
            if (!fs_1.default.existsSync(logPath)) {
                return res.status(404).json({ error: "Log no encontrado" });
            }
            res.download(logPath, logName);
        }
        catch (e) {
            res.status(500).json({ error: "Error al descargar el log" });
        }
        return;
    });
    /**
     * Creates a new ticket.
     * @route POST /dashboard/utils/tickets
     * @param req.body.userId - The ID of the user creating the ticket.
     * @param req.body.guildId - The guild ID (for Discord systems).
     * @param req.body.channelId - The channel ID (for Discord systems).
     * @param req.body.reason - The reason for the ticket.
     * @param req.body.userName - The name of the user (for ticket metadata).
     * @param req.body.userAvatar - The avatar of the user (for ticket metadata).
     * @returns {Object} JSON response with ticket creation status and ticket data.
     */
    app.post(formatRoute("tickets"), async (req, res) => {
        /*
        model TicketUser {
      id        String       @id @default(auto()) @map("_id") @db.ObjectId
      userId    String
      guildId   String? //para los sistemas de discord
      channelId String? //para los sistemas de discord
      ticketId  String       @unique
      messageId String? //para los sistemas de discord
      status    TicketStatus @default(OPEN)
      reason    String?
      closedBy  String? // ID del usuario que cerró el ticket
      closedAt  DateTime? // Fecha de cierre del ticket
      notes     String[] @default([]) // Array de notas del ticket
      attachments String[] @default([]) // Array de URLs de archivos adjuntos
      userDiscordId String? // ID del usuario de Discord asociado al ticket
      createdAt DateTime     @default(now())
      updatedAt DateTime     @updatedAt
    
      @@index([userId])
    }
        * */
        const { userId, guildId, channelId, reason, userName, userAvatar } = req.body;
        if (!userId || !guildId || !channelId) {
            return res.status(400).json({
                success: false,
                message: "userId, guildId and channelId are required",
            });
        }
        const ticketId = `ticket-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        const newTicket = await main_1.main.prisma.ticketUser.create({
            data: {
                userId,
                guildId,
                channelId,
                ticketId,
                userName,
                userAvatar,
                reason: reason || null,
                status: "OPEN",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        // --- Notificación Discord ---
        const notifier = new notification_1.Notification();
        await notifier.sendWebhookNotification("New Ticket Created", `A new support ticket has been created.\n\n**User:** ${userName || userId}\n**Ticket ID:** ${ticketId}\n**Reason:** ${reason || "No reason provided"}\n**Date:** ${new Date().toISOString()}`, "#28a745", [
            { name: "Guild ID", value: guildId || "N/A", inline: true },
            { name: "Channel ID", value: channelId || "N/A", inline: true },
        ], {
            content: "🎫 New ticket event",
            username: "Ticket Bot",
        });
        return res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: newTicket,
        });
    });
    /**
     * Gets all tickets for a user.
     * @route GET /dashboard/utils/tickets/:userId
     * @param userId - The ID of the user whose tickets to retrieve.
     * @returns {Object} JSON response with ticket data.
     */
    app.get(formatRoute("tickets/:userId"), async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }
        // Get pagination and search parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filter = req.query.filter || ""; // For example: "OPEN", "CLOSED", etc.
        const search = req.query.search || "";
        // Build filter for Prisma
        const where = { userId };
        if (filter && filter !== "all") {
            where.status = filter;
        }
        if (search) {
            where.reason = { contains: search, mode: "insensitive" };
        }
        // Count total tickets for pagination
        const total = await main_1.main.prisma.ticketUser.count();
        // Get paginated tickets
        const tickets = await main_1.main.prisma.ticketUser.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });
        return res.status(200).json({
            success: true,
            data: tickets,
            total,
            page,
            limit,
        });
    });
    /**
     * Gets a specific ticket by ID for a user.
     * @route GET /dashboard/utils/tickets/:userId/:ticketId
     * @param userId - The ID of the user who owns the ticket.
     * @param ticketId - The ID of the ticket to retrieve.
     * @returns {Object} JSON response with ticket data.
     */
    app.get(formatRoute("tickets/:userId/:ticketId"), async (req, res) => {
        const { userId, ticketId } = req.params;
        if (!userId || !ticketId) {
            return res.status(400).json({
                success: false,
                message: "userId and ticketId are required",
            });
        }
        const ticket = await main_1.main.prisma.ticketUser.findFirst({
            where: { userId, ticketId },
        });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: ticket,
        });
    });
    /**
     * Updates a specific ticket by ID for a user.
     * @route PUT /dashboard/utils/tickets/:userId/:ticketId
     * @param userId - The ID of the user who owns the ticket.
     * @param ticketId - The ID of the ticket to update.
     * @param req.body.status - The new status for the ticket.
     * @param req.body.reason - The new reason for the ticket.
     * @returns {Object} JSON response with update status and ticket data.
     */
    app.put(formatRoute("tickets/:userId/:ticketId"), async (req, res) => {
        const { userId, ticketId } = req.params;
        const { status, reason } = req.body;
        if (!userId || !ticketId) {
            return res.status(400).json({
                success: false,
                message: "userId and ticketId are required",
            });
        }
        const ticket = await main_1.main.prisma.ticketUser.findFirst({
            where: { userId, ticketId },
        });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
        // Detect if the ticket is being closed
        const isClosing = status === "CLOSED" && ticket.status !== "CLOSED";
        const updatedTicket = await main_1.main.prisma.ticketUser.update({
            where: { id: ticket.id },
            data: {
                status: status || ticket.status,
                reason: reason || ticket.reason,
                updatedAt: new Date(),
                closedAt: isClosing ? new Date() : ticket.closedAt,
            },
        });
        // NEW: If closed, generate and save transcript
        if (isClosing) {
            // Get ticket messages
            const messages = await main_1.main.prisma.ticketMessage.findMany({
                where: { ticketId: ticket.ticketId },
                orderBy: { timestamp: "asc" },
            });
            // Unique participants (use IDs, not names)
            const participants = [...new Set(messages.map((m) => m.senderId))];
            await main_1.main.prisma.transcript.create({
                data: {
                    type: "ticket",
                    referenceId: ticket.ticketId,
                    participants, // <-- now IDs
                    content: messages.map((m) => ({
                        senderId: m.senderId,
                        senderName: m.senderName,
                        senderAvatar: m.senderAvatar,
                        content: m.content,
                        timestamp: m.timestamp,
                    })),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }
        return res.status(200).json({
            success: true,
            data: updatedTicket,
        });
    });
    /**
     * Sends a message in a ticket.
     * @route POST /dashboard/utils/tickets/:userId/:ticketId/message
     * @param userId - The ID of the user sending the message.
     * @param ticketId - The ID of the ticket to send the message in.
     * @param req.body.message - The content of the message.
     * @returns {Object} JSON response with message status and message data.
     */
    app.post(formatRoute("tickets/:userId/:ticketId/message"), async (req, res) => {
        const { userId, ticketId } = req.params;
        const { message } = req.body;
        if (!userId || !ticketId || !message) {
            return res.status(400).json({
                success: false,
                message: "userId, ticketId y message son requeridos",
            });
        }
        // Busca el ticket
        const ticket = await main_1.main.prisma.ticketUser.findFirst({
            where: { userId, ticketId },
        });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket no encontrado",
            });
        }
        // NUEVO: No permitir mensajes si el ticket está cerrado
        if (ticket.status === "CLOSED") {
            return res.status(403).json({
                success: false,
                message: "No se pueden enviar mensajes a un ticket cerrado",
            });
        }
        // Obtén datos del usuario (puedes mejorarlo según tu auth)
        const senderId = userId;
        const senderName = req.user?.name || "Usuario";
        const senderAvatar = req.user?.avatar || null;
        // Crea el mensaje
        const newMessage = await main_1.main.prisma.ticketMessage.create({
            data: {
                ticketId: ticket.ticketId,
                senderId,
                senderName,
                senderAvatar,
                content: message,
                timestamp: new Date(),
            },
        });
        if (main_1.main.api.io) {
            main_1.main.api.io.to(ticket.ticketId).emit("ticket:message", {
                ticketId: ticket.ticketId,
                message: newMessage,
            });
        }
        return res.status(201).json({
            success: true,
            message: newMessage,
        });
    });
    /**
     * Gets all transcripts for a user.
     * @route GET /dashboard/utils/transcripts
     * @param req.query.userId - The ID of the user whose transcripts to retrieve.
     * @param req.query.type - The type of transcripts to retrieve (e.g., "ticket", "chat", or "all").
     * @param req.query.page - The page number for pagination.
     * @param req.query.limit - The number of items per page.
     * @returns {Object} JSON response with transcript data.
     */
    app.get(formatRoute("transcripts"), async (req, res) => {
        const userId = req.query.userId;
        const type = req.query.type;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }
        // Base filter: user must be a participant
        const where = {
            participants: { has: userId },
        };
        // Type filter (ticket/chat)
        if (type && type !== "all") {
            where.type = type;
        }
        // Total for pagination
        const total = await main_1.main.prisma.transcript.count({ where });
        // Pagination
        const transcripts = await main_1.main.prisma.transcript.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });
        // Format participants (you can enrich this if you have user info)
        const data = transcripts.map((t) => ({
            id: t.id,
            type: t.type,
            createdAt: t.createdAt,
            participants: t.participants.map((name) => ({ name })), // Adjust if you have more info
            content: undefined, // Content is not sent here
        }));
        return res.status(200).json({
            success: true,
            data,
            total,
            page,
            limit,
        });
    });
    /**
     * Gets a specific transcript by ID.
     * @route GET /dashboard/utils/transcripts/:transcriptId
     * @param transcriptId - The ID of the transcript to retrieve.
     * @returns {Object} JSON response with transcript data.
     */
    app.get(formatRoute("transcripts/:transcriptId"), async (req, res) => {
        const { transcriptId } = req.params;
        if (!transcriptId) {
            return res.status(400).json({
                success: false,
                message: "transcriptId is required",
            });
        }
        // Validate transcriptId is a valid string (e.g., a 24-character ObjectId)
        if (typeof transcriptId !== "string" || transcriptId.length !== 24) {
            return res.status(400).json({
                success: false,
                message: "transcriptId inválido",
            });
        }
        const transcript = await main_1.main.prisma.transcript.findUnique({
            where: { id: transcriptId },
        });
        if (!transcript) {
            return res.status(404).json({
                success: false,
                message: "Transcript not found",
            });
        }
        // Calculate duration if timestamps are present in content
        let duration = null;
        if (Array.isArray(transcript.content) &&
            transcript.content.length > 1 &&
            typeof transcript.content[0] === "object" &&
            transcript.content[0] !== null &&
            Object.prototype.hasOwnProperty.call(transcript.content[0], "timestamp") &&
            typeof transcript.content[transcript.content.length - 1] === "object" &&
            transcript.content[transcript.content.length - 1] !== null &&
            Object.prototype.hasOwnProperty.call(transcript.content[transcript.content.length - 1], "timestamp")) {
            const first = transcript.content[0].timestamp;
            const last = transcript.content[transcript.content.length - 1].timestamp;
            if (first && last) {
                duration = new Date(last).getTime() - new Date(first).getTime();
            }
        }
        return res.status(200).json({
            success: true,
            data: {
                id: transcript.id,
                type: transcript.type,
                createdAt: transcript.createdAt,
                participants: transcript.participants.map((name) => ({ name })),
                duration,
                content: transcript.content,
            },
        });
    });
    /**
     * Downloads a specific transcript as a PDF file.
     * @route GET /dashboard/utils/transcripts/:transcriptId/download
     * @param transcriptId - The ID of the transcript to download.
     */
    app.get(formatRoute("transcripts/:transcriptId/download"), async (req, res) => {
        const { transcriptId } = req.params;
        if (!transcriptId) {
            return res.status(400).json({
                success: false,
                message: "transcriptId is required",
            });
        }
        const transcript = await main_1.main.prisma.transcript.findUnique({
            where: { id: transcriptId },
        });
        if (!transcript) {
            return res.status(404).json({
                success: false,
                message: "Transcript not found",
            });
        }
        // Dynamically create PDF
        const doc = new pdfkit_1.default();
        const passthrough = new stream_1.default.PassThrough();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="transcripcion-${transcriptId}.pdf"`);
        doc.pipe(passthrough);
        doc.fontSize(18).text(`Transcripción #${transcript.id}`, { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Tipo: ${transcript.type}`);
        doc.text(`Fecha: ${transcript.createdAt}`);
        doc.text(`Participantes: ${transcript.participants.join(", ")}`);
        doc.moveDown();
        doc.fontSize(14).text("Contenido:", { underline: true });
        doc.moveDown();
        if (Array.isArray(transcript.content)) {
            transcript.content.forEach((msg) => {
                doc.fontSize(10).text(`[${msg.timestamp}] ${msg.senderName || "Sistema"}: ${msg.content}`);
                doc.moveDown(0.5);
            });
        }
        doc.end();
        passthrough.pipe(res);
        return;
    });
    /**
     * Gets all messages for a specific ticket.
     * @route GET /dashboard/utils/tickets/:userId/:ticketId/messages
     * @param userId - The ID of the user who owns the ticket.
     * @param ticketId - The ID of the ticket to retrieve messages for.
     * @returns {Object} JSON response with message data.
     */
    app.get(formatRoute("tickets/:userId/:ticketId/messages"), async (req, res) => {
        const { userId, ticketId } = req.params;
        if (!userId || !ticketId) {
            return res.status(400).json({
                success: false,
                message: "userId and ticketId are required",
            });
        }
        // Busca los mensajes del ticket
        const messages = await main_1.main.prisma.ticketMessage.findMany({
            where: { ticketId },
            orderBy: { timestamp: "asc" },
        });
        return res.status(200).json({
            success: true,
            data: messages,
        });
    });
    //***********************************************************//
    //
    // ADMIN SECTION TICKET MANAGER
    //
    //************************************************************//
    // Estadísticas de tickets
    /**
     * Gets ticket statistics for the admin dashboard.
     * @route GET /dashboard/utils/admin/tickets/stats
     * @returns {Object} JSON response with ticket statistics.
     */
    app.get(formatRoute("admin/tickets/stats"), async (_req, res) => {
        try {
            // General statistics
            const totalTickets = await main_1.main.prisma.ticketUser.count();
            const openTickets = await main_1.main.prisma.ticketUser.count({ where: { status: "OPEN" } });
            const closedTickets = await main_1.main.prisma.ticketUser.count({ where: { status: "CLOSED" } });
            const pendingTickets = await main_1.main.prisma.ticketUser.count({ where: { status: "PENDING" } });
            // Tickets by category (assuming there is a category field)
            const ticketsByCategory = await main_1.main.prisma.ticketUser.findMany();
            // Tickets by month (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const ticketsByMonth = await main_1.main.prisma.ticketUser.groupBy({
                by: ["createdAt"],
                where: {
                    createdAt: {
                        gte: sixMonthsAgo,
                    },
                },
                _count: {
                    _all: true,
                },
            });
            // Top users who open tickets
            const topUsers = await main_1.main.prisma.ticketUser.groupBy({
                by: ["userId"],
                _count: {
                    userId: true,
                },
                orderBy: {
                    _count: {
                        userId: "desc",
                    },
                },
                take: 5,
            });
            // DO NOT enrich with user info
            const topUsersWithInfo = topUsers.map((user) => ({
                userId: user.userId,
                ticketCount: user._count.userId,
            }));
            return res.status(200).json({
                success: true,
                data: {
                    totalTickets,
                    openTickets,
                    closedTickets,
                    pendingTickets,
                    ticketsByCategory,
                    ticketsByMonth,
                    topUsers: topUsersWithInfo,
                },
            });
        }
        catch (error) {
            console.error("Error getting ticket stats:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    // Obtener todos los tickets (para admin)
    /**
     * Gets all tickets for admin.
     * @route GET /dashboard/utils/admin/tickets
     * @param req.query.page - Page number for pagination.
     * @param req.query.limit - Number of items per page.
     * @param req.query.status - Filter by ticket status (e.g., "OPEN", "CLOSED", "PENDING", or "all").
     * @param req.query.search - Search term for ticket reason, userId, or ticketId.
     * @returns {Object} JSON response with paginated ticket data.
     */
    app.get(formatRoute("admin/tickets"), async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status || "all";
            const search = req.query.search || "";
            const where = {};
            if (status !== "all") {
                where.status = status;
            }
            if (search) {
                where.OR = [
                    { reason: { contains: search, mode: "insensitive" } },
                    { userId: { contains: search, mode: "insensitive" } },
                    { ticketId: { contains: search, mode: "insensitive" } },
                ];
            }
            const total = await main_1.main.prisma.ticketUser.count({ where });
            const tickets = await main_1.main.prisma.ticketUser.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    messages: {
                        orderBy: { timestamp: "asc" },
                        take: 1,
                    },
                },
            });
            // No longer enrich with user data
            return res.status(200).json({
                success: true,
                data: tickets,
                total,
                page,
                limit,
            });
        }
        catch (error) {
            console.error("Error getting tickets:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Assigns a ticket to an admin.
     * @route PUT /dashboard/utils/admin/tickets/:ticketId/assign
     * @param ticketId - The ID of the ticket to assign.
     * @param req.body.adminId - The ID of the admin to assign the ticket to.
     * @returns {Object} JSON response with updated ticket data.
     */
    app.put(formatRoute("admin/tickets/:ticketId/assign"), async (req, res) => {
        try {
            const { adminId } = req.body;
            const { ticketId } = req.params;
            console.log(adminId);
            if (!ticketId || !adminId) {
                return res.status(400).json({
                    success: false,
                    message: "ticketId and adminId are required",
                });
            }
            // Check if the ticket exists
            const ticket = await main_1.main.prisma.ticketUser.findFirst({
                where: { ticketId },
            });
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found",
                });
            }
            // Check if the admin exists
            const adminMany = await main_1.main.prisma.userAPI.findMany();
            const admin = adminMany.find((a) => a.discord?.userId === adminId);
            console.log("Admin found:", admin);
            console.log(admin);
            if (!admin) {
                return res.status(400).json({
                    sucess: false,
                    message: "user not registered discord data",
                });
            }
            if (!["admin", "developer", "owner"].includes(admin.role)) {
                return res.status(400).json({
                    success: false,
                    message: "Admin user not found or not authorized",
                });
            }
            // Update ticket
            const updatedTicket = await main_1.main.prisma.ticketUser.update({
                where: { ticketId },
                data: {
                    status: "PENDING",
                    updatedAt: new Date(),
                    assignedTo: {
                        userId: admin.discord?.userId,
                        userAvatar: admin.discord?.userAvatar,
                        userName: admin.discord?.userName,
                    },
                },
            });
            return res.status(200).json({
                success: true,
                data: updatedTicket,
            });
        }
        catch (error) {
            console.error("Error assigning ticket:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Sends a message as an admin in a ticket.
     * @route POST /dashboard/utils/admin/tickets/:ticketId/message
     * @param ticketId - The ID of the ticket to send the message in.
     * @param req.body.message - The content of the message.
     * @param req.body.adminId - The ID of the admin sending the message.
     * @returns {Object} JSON response with message status and message data.
     */
    app.post(formatRoute("admin/tickets/:ticketId/message"), async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { message, adminId } = req.body;
            if (!ticketId || !adminId || !message) {
                return res.status(400).json({
                    success: false,
                    message: "ticketId, adminId and message are required",
                });
            }
            // Check if the ticket exists and is open/pending
            const ticket = await main_1.main.prisma.ticketUser.findUnique({
                where: { ticketId },
            });
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found",
                });
            }
            if (ticket.status === "CLOSED") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot send message to closed ticket",
                });
            }
            const adminMany = await main_1.main.prisma.userAPI.findMany();
            const admin = adminMany.find((a) => a.discord?.userId === adminId);
            console.log("Admin found:", admin);
            console.log(admin);
            if (!admin) {
                return res.status(400).json({
                    success: false,
                    message: "Admin user not found",
                });
            }
            // Create message
            const newMessage = await main_1.main.prisma.ticketMessage.create({
                data: {
                    ticketId,
                    senderId: adminId,
                    senderName: admin.name || "Admin",
                    content: message,
                    timestamp: new Date(),
                    isAdmin: true,
                },
            });
            // Update ticket status if it was open
            if (ticket.status === "OPEN") {
                await main_1.main.prisma.ticketUser.update({
                    where: { ticketId },
                    data: {
                        status: "PENDING",
                        updatedAt: new Date(),
                    },
                });
            }
            return res.status(201).json({
                success: true,
                data: newMessage,
            });
        }
        catch (error) {
            console.error("Error sending admin message:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Closes a ticket as an admin.
     * @route PUT /dashboard/utils/admin/tickets/:ticketId/close
     * @param ticketId - The ID of the ticket to close.
     * @param req.body.adminId - The ID of the admin closing the ticket.
     * @returns {Object} JSON response with updated ticket data.
     */
    app.put(formatRoute("admin/tickets/:ticketId/close"), async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { adminId } = req.body;
            if (!ticketId || !adminId) {
                return res.status(400).json({
                    success: false,
                    message: "ticketId and adminId are required",
                });
            }
            // Check if the ticket exists
            const ticket = await main_1.main.prisma.ticketUser.findUnique({
                where: { ticketId },
            });
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found",
                });
            }
            // Check if the admin exists
            const admin = await main_1.main.prisma.userAPI.findFirst({
                where: { discord: { userId: adminId } },
            });
            if (!admin || !["admin", "developer", "owner"].includes(admin.role)) {
                return res.status(400).json({
                    success: false,
                    message: "Admin user not found or not authorized",
                });
            }
            // Update ticket
            const updatedTicket = await main_1.main.prisma.ticketUser.update({
                where: { ticketId },
                data: {
                    status: "CLOSED",
                    closedBy: adminId,
                    closedAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            // Generate transcript
            const messages = await main_1.main.prisma.ticketMessage.findMany({
                where: { ticketId },
                orderBy: { timestamp: "asc" },
            });
            const participants = [...new Set(messages.map((m) => m.senderId))];
            await main_1.main.prisma.transcript.create({
                data: {
                    type: "ticket",
                    referenceId: ticketId,
                    participants,
                    content: messages.map((m) => ({
                        senderId: m.senderId,
                        senderName: m.senderName,
                        senderAvatar: m.senderAvatar,
                        content: m.content,
                        timestamp: m.timestamp,
                        isAdmin: m.isAdmin,
                    })),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            return res.status(200).json({
                success: true,
                data: updatedTicket,
            });
        }
        catch (error) {
            console.error("Error closing ticket:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Gets the support team members.
     * @route GET /dashboard/utils/admin/support/team
     * @returns {Object} JSON response with support team data.
     */
    app.get(formatRoute("admin/support/team"), async (_req, res) => {
        try {
            // Find users with admin, support, moderator, developer, owner roles
            const admins = await main_1.main.prisma.userAPI.findMany({
                where: {
                    role: { in: ["admin", "developer", "owner"] },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });
            return res.status(200).json({ success: true, data: admins });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Gets all messages for a specific ticket (admin view).
     * @route GET /dashboard/utils/admin/tickets/:ticketId/messages
     * @param ticketId - The ID of the ticket to retrieve messages for.
     * @returns {Object} JSON response with message data.
     */
    app.get(formatRoute("admin/tickets/:ticketId/messages"), async (req, res) => {
        try {
            const { ticketId } = req.params;
            if (!ticketId) {
                return res.status(400).json({
                    success: false,
                    message: "ticketId is required",
                });
            }
            // Busca los mensajes del ticket
            const messages = await main_1.main.prisma.ticketMessage.findMany({
                where: { ticketId },
                orderBy: { timestamp: "asc" },
            });
            return res.status(200).json({
                success: true,
                data: messages,
            });
        }
        catch (error) {
            console.error("Error getting ticket messages:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Gets detailed information about a specific ticket (admin view).
     * @route GET /dashboard/utils/admin/tickets/:ticketId
     * @param ticketId - The ID of the ticket to retrieve.
     * @returns {Object} JSON response with ticket data.
     */
    app.get(formatRoute("admin/tickets/:ticketId"), async (req, res) => {
        try {
            const { ticketId } = req.params;
            if (!ticketId) {
                return res.status(400).json({
                    success: false,
                    message: "ticketId is required",
                });
            }
            const ticket = await main_1.main.prisma.ticketUser.findUnique({
                where: { ticketId },
                include: {
                    messages: {
                        orderBy: { timestamp: "asc" },
                    },
                },
            });
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found",
                });
            }
            return res.status(200).json({
                success: true,
                data: ticket,
            });
        }
        catch (error) {
            console.error("Error getting ticket:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Gets support statistics for the admin dashboard.
     * @route GET /dashboard/utils/admin/support/stats
     * @returns {Object} JSON response with support statistics.
     */
    app.get(formatRoute("admin/support/stats"), async (_req, res) => {
        try {
            // General statistics
            const totalTickets = await main_1.main.prisma.ticketUser.count();
            const openTickets = await main_1.main.prisma.ticketUser.count({ where: { status: "OPEN" } });
            const closedTickets = await main_1.main.prisma.ticketUser.count({ where: { status: "CLOSED" } });
            const pendingTickets = await main_1.main.prisma.ticketUser.count({ where: { status: "PENDING" } });
            // Tickets by category (assuming there is a category field)
            const ticketsByCategory = await main_1.main.prisma.ticketUser.findMany();
            // Tickets by month (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const ticketsByMonth = await main_1.main.prisma.ticketUser.groupBy({
                by: ["createdAt"],
                where: {
                    createdAt: {
                        gte: sixMonthsAgo,
                    },
                },
                _count: {
                    _all: true,
                },
            });
            // Top users who open tickets
            const topUsers = await main_1.main.prisma.ticketUser.groupBy({
                by: ["userId"],
                _count: {
                    userId: true,
                },
                orderBy: {
                    _count: {
                        userId: "desc",
                    },
                },
                take: 5,
            });
            // DO NOT enrich with user info
            const topUsersWithInfo = topUsers.map((user) => ({
                userId: user.userId,
                ticketCount: user._count.userId,
            }));
            return res.status(200).json({
                success: true,
                data: {
                    totalTickets,
                    openTickets,
                    closedTickets,
                    pendingTickets,
                    ticketsByCategory,
                    ticketsByMonth,
                    topUsers: topUsersWithInfo,
                },
            });
        }
        catch (error) {
            console.error("Error getting ticket stats:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * Endpoint to get all transcripts (ADMIN).
     * @route GET /dashboard/utils/admin/transcripts
     * @param req.query.page - Page number for pagination.
     * @param req.query.limit - Number of items per page.
     * @param req.query.filter - Filter by transcript type (e.g., "ticket", "chat", or "all").
     * @returns {Object} JSON response with paginated transcript data.
     */
    app.get(formatRoute("admin/transcripts"), async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filter = req.query.filter || "all";
            // Build Prisma filter
            const where = {};
            if (filter && filter !== "all") {
                where.type = filter; // e.g., "ticket", "chat", etc.
            }
            // Total transcripts for pagination
            const total = await main_1.main.prisma.transcript.count({ where });
            // Get paginated transcripts
            const transcripts = await main_1.main.prisma.transcript.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            });
            /**
             * Formats transcript data for frontend.
             */
            const data = transcripts.map((t) => ({
                transcriptId: t.id,
                type: t.type,
                referenceId: t.referenceId,
                participants: t.participants,
                createdAt: t.createdAt,
                duration: (() => {
                    if (Array.isArray(t.content) &&
                        t.content.length > 1 &&
                        typeof t.content[0] === "object" &&
                        t.content[0] !== null &&
                        "timestamp" in t.content[0] &&
                        typeof t.content[t.content.length - 1] === "object" &&
                        t.content[t.content.length - 1] !== null &&
                        Object.prototype.hasOwnProperty.call(t.content[t.content.length - 1], "timestamp")) {
                        return (new Date(t.content[t.content.length - 1].timestamp).getTime() -
                            new Date(t.content[0].timestamp).getTime());
                    }
                    return null;
                })(),
            }));
            return res.status(200).json({
                success: true,
                data,
                total,
                page,
                limit,
            });
        }
        catch (error) {
            console.error("Error getting admin transcripts:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    });
    /**
     * CRUD endpoints for Client, Discord, and WhatsApp models.
     * All responses/messages are in English and include debug logs.
     */
    // ===================== CLIENT =====================
    /**
     * Get all clients.
     * @route GET /dashboard/utils/client
     */
    app.get(formatRoute("client"), async (_req, res) => {
        try {
            const clients = await main_1.main.prisma.client.findMany();
            console.debug("[Client][GET] All clients fetched:", clients.length);
            return res.status(200).json({ success: true, data: clients });
        }
        catch (error) {
            console.error("[Client][GET] Error fetching clients:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch clients", error: error.message });
        }
    });
    /**
     * Get a client by ID.
     * @route GET /dashboard/utils/client/:id
     */
    app.get(formatRoute("client/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            const clientData = await main_1.main.prisma.client.findUnique({ where: { id } });
            if (!clientData) {
                console.debug(`[Client][GET] Client not found: ${id}`);
                return res.status(404).json({ success: false, message: "Client not found" });
            }
            console.debug(`[Client][GET] Client fetched: ${id}`);
            return res.status(200).json({ success: true, data: clientData });
        }
        catch (error) {
            console.error("[Client][GET] Error fetching client:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch client", error: error.message });
        }
    });
    /**
     * Create a new client.
     * @route POST /dashboard/utils/client
     */
    app.post(formatRoute("client"), async (req, res) => {
        try {
            const data = req.body;
            const created = await main_1.main.prisma.client.create({ data });
            console.debug("[Client][POST] Client created:", created.id);
            return res.status(201).json({ success: true, message: "Client created successfully", data: created });
        }
        catch (error) {
            console.error("[Client][POST] Error creating client:", error);
            return res.status(500).json({ success: false, message: "Failed to create client", error: error.message });
        }
    });
    /**
     * Update a client by ID.
     * @route PUT /dashboard/utils/client/:id
     */
    app.put(formatRoute("client/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const updated = await main_1.main.prisma.client.update({ where: { id }, data });
            console.debug(`[Client][PUT] Client updated: ${id}`);
            return res.status(200).json({ success: true, message: "Client updated successfully", data: updated });
        }
        catch (error) {
            console.error("[Client][PUT] Error updating client:", error);
            return res.status(500).json({ success: false, message: "Failed to update client", error: error.message });
        }
    });
    /**
     * Delete a client by ID.
     * @route DELETE /dashboard/utils/client/:id
     */
    app.delete(formatRoute("client/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            await main_1.main.prisma.client.delete({ where: { id } });
            console.debug(`[Client][DELETE] Client deleted: ${id}`);
            return res.status(200).json({ success: true, message: "Client deleted successfully" });
        }
        catch (error) {
            console.error("[Client][DELETE] Error deleting client:", error);
            return res.status(500).json({ success: false, message: "Failed to delete client", error: error.message });
        }
    });
    // ===================== DISCORD =====================
    /**
     * Get all Discord configs.
     * @route GET /dashboard/utils/discord
     */
    app.get(formatRoute("discord"), async (_req, res) => {
        try {
            const discordConfigs = await main_1.main.prisma.discord.findMany();
            console.debug("[Discord][GET] All Discord configs fetched:", discordConfigs.length);
            return res.status(200).json({ success: true, data: discordConfigs });
        }
        catch (error) {
            console.error("[Discord][GET] Error fetching Discord configs:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch Discord configs", error: error.message });
        }
    });
    /**
     * Get a Discord config by ID.
     * @route GET /dashboard/utils/discord/:id
     */
    app.get(formatRoute("discord/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            const discordData = await main_1.main.prisma.discord.findUnique({ where: { id } });
            if (!discordData) {
                console.debug(`[Discord][GET] Discord config not found: ${id}`);
                return res.status(404).json({ success: false, message: "Discord config not found" });
            }
            console.debug(`[Discord][GET] Discord config fetched: ${id}`);
            return res.status(200).json({ success: true, data: discordData });
        }
        catch (error) {
            console.error("[Discord][GET] Error fetching Discord config:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch Discord config", error: error.message });
        }
    });
    /**
     * Create a new Discord config.
     * @route POST /dashboard/utils/discord
     */
    app.post(formatRoute("discord"), async (req, res) => {
        try {
            const data = req.body;
            const created = await main_1.main.prisma.discord.create({ data });
            console.debug("[Discord][POST] Discord config created:", created.id);
            return res.status(201).json({ success: true, message: "Discord config created successfully", data: created });
        }
        catch (error) {
            console.error("[Discord][POST] Error creating Discord config:", error);
            return res.status(500).json({ success: false, message: "Failed to create Discord config", error: error.message });
        }
    });
    /**
     * Update a Discord config by ID.
     * @route PUT /dashboard/utils/discord/:id
     */
    app.put(formatRoute("discord/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const updated = await main_1.main.prisma.discord.update({ where: { id }, data });
            console.debug(`[Discord][PUT] Discord config updated: ${id}`);
            return res.status(200).json({ success: true, message: "Discord config updated successfully", data: updated });
        }
        catch (error) {
            console.error("[Discord][PUT] Error updating Discord config:", error);
            return res.status(500).json({ success: false, message: "Failed to update Discord config", error: error.message });
        }
    });
    /**
     * Delete a Discord config by ID.
     * @route DELETE /dashboard/utils/discord/:id
     */
    app.delete(formatRoute("discord/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            await main_1.main.prisma.discord.delete({ where: { id } });
            console.debug(`[Discord][DELETE] Discord config deleted: ${id}`);
            return res.status(200).json({ success: true, message: "Discord config deleted successfully" });
        }
        catch (error) {
            console.error("[Discord][DELETE] Error deleting Discord config:", error);
            return res.status(500).json({ success: false, message: "Failed to delete Discord config", error: error.message });
        }
    });
    // ===================== WHATSAPP =====================
    /**
     * Get all WhatsApp configs.
     * @route GET /dashboard/utils/whatsapp
     */
    app.get(formatRoute("whatsapp"), async (_req, res) => {
        try {
            const whatsappConfigs = await main_1.main.prisma.whatsApp.findMany();
            console.debug("[WhatsApp][GET] All WhatsApp configs fetched:", whatsappConfigs.length);
            return res.status(200).json({ success: true, data: whatsappConfigs });
        }
        catch (error) {
            console.error("[WhatsApp][GET] Error fetching WhatsApp configs:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch WhatsApp configs",
                error: error.message,
            });
        }
    });
    /**
     * Get a WhatsApp config by ID.
     * @route GET /dashboard/utils/whatsapp/:id
     */
    app.get(formatRoute("whatsapp/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            const whatsappData = await main_1.main.prisma.whatsApp.findUnique({ where: { id } });
            if (!whatsappData) {
                console.debug(`[WhatsApp][GET] WhatsApp config not found: ${id}`);
                return res.status(404).json({ success: false, message: "WhatsApp config not found" });
            }
            console.debug(`[WhatsApp][GET] WhatsApp config fetched: ${id}`);
            return res.status(200).json({ success: true, data: whatsappData });
        }
        catch (error) {
            console.error("[WhatsApp][GET] Error fetching WhatsApp config:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch WhatsApp config", error: error.message });
        }
    });
    /**
     * Create a new WhatsApp config.
     * @route POST /dashboard/utils/whatsapp
     */
    app.post(formatRoute("whatsapp"), async (req, res) => {
        try {
            const data = req.body;
            const created = await main_1.main.prisma.whatsApp.create({ data });
            console.debug("[WhatsApp][POST] WhatsApp config created:", created.id);
            return res.status(201).json({ success: true, message: "WhatsApp config created successfully", data: created });
        }
        catch (error) {
            console.error("[WhatsApp][POST] Error creating WhatsApp config:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create WhatsApp config",
                error: error.message,
            });
        }
    });
    /**
     * Update a WhatsApp config by ID.
     * @route PUT /dashboard/utils/whatsapp/:id
     */
    app.put(formatRoute("whatsapp/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const updated = await main_1.main.prisma.whatsApp.update({ where: { id }, data });
            console.debug(`[WhatsApp][PUT] WhatsApp config updated: ${id}`);
            return res.status(200).json({ success: true, message: "WhatsApp config updated successfully", data: updated });
        }
        catch (error) {
            console.error("[WhatsApp][PUT] Error updating WhatsApp config:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update WhatsApp config",
                error: error.message,
            });
        }
    });
    /**
     * Delete a WhatsApp config by ID.
     * @route DELETE /dashboard/utils/whatsapp/:id
     */
    app.delete(formatRoute("whatsapp/:id"), async (req, res) => {
        try {
            const { id } = req.params;
            await main_1.main.prisma.whatsApp.delete({ where: { id } });
            console.debug(`[WhatsApp][DELETE] WhatsApp config deleted: ${id}`);
            return res.status(200).json({ success: true, message: "WhatsApp config deleted successfully" });
        }
        catch (error) {
            console.error("[WhatsApp][DELETE] Error deleting WhatsApp config:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete WhatsApp config",
                error: error.message,
            });
        }
    });
    // ===================== COMMAND =====================
    /**
     * Get all commands for a guild.
     * @route GET /dashboard/utils/commands/:guildId
     */
    app.get(formatRoute("commands/:guildId"), async (req, res) => {
        try {
            const { guildId } = req.params;
            const commands = await main_1.main.prisma.command.findMany({
                where: { guildId },
                orderBy: { createdAt: "desc" },
            });
            console.debug(`[Command][GET] Commands fetched for guild: ${guildId}`);
            return res.status(200).json({
                success: true,
                data: commands,
            });
        }
        catch (error) {
            console.error("[Command][GET] Error fetching commands:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch commands",
                error: error.message,
            });
        }
    });
    /**
     * Get a specific command by ID.
     * @route GET /dashboard/utils/commands/:guildId/:commandId
     */
    app.get(formatRoute("commands/:guildId/:commandId"), async (req, res) => {
        try {
            const { guildId, commandId } = req.params;
            const command = await main_1.main.prisma.command.findFirst({
                where: {
                    id: commandId,
                    guildId,
                },
            });
            if (!command) {
                console.debug(`[Command][GET] Command not found: ${commandId}`);
                return res.status(404).json({
                    success: false,
                    message: "Command not found",
                });
            }
            console.debug(`[Command][GET] Command fetched: ${commandId}`);
            return res.status(200).json({
                success: true,
                data: command,
            });
        }
        catch (error) {
            console.error("[Command][GET] Error fetching command:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch command",
                error: error.message,
            });
        }
    });
    /**
     * Create a new command.
     * @route POST /dashboard/utils/commands
     */
    app.post(formatRoute("commands"), async (req, res) => {
        try {
            const { guildId, name, embed, embedColor, embedTitle, embedFooter, embedImage, embedThumbnail, embedAuthor, buttons, file, description, response, fields, } = req.body;
            if (!guildId || !name) {
                return res.status(400).json({
                    success: false,
                    message: "guildId and name are required fields",
                });
            }
            // Validate buttons structure if provided
            if (buttons) {
                try {
                    const parsedButtons = JSON.parse(buttons);
                    if (!Array.isArray(parsedButtons)) {
                        return res.status(400).json({
                            success: false,
                            message: "Buttons must be an array",
                        });
                    }
                    for (const btn of parsedButtons) {
                        if (!btn.label || !btn.style) {
                            return res.status(400).json({
                                success: false,
                                message: "Each button must have label, style, and customId properties",
                            });
                        }
                    }
                }
                catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid buttons format. Must be valid JSON array",
                    });
                }
            }
            if (fields) {
                try {
                    const parsedFields = JSON.parse(fields);
                    if (!Array.isArray(parsedFields)) {
                        return res.status(400).json({
                            success: false,
                            message: "Buttons must be an array",
                        });
                    }
                    for (const field of parsedFields) {
                        if (!field.name || !field.value) {
                            return res.status(400).json({
                                success: false,
                                message: "Each fields must have name, value properties",
                            });
                        }
                    }
                }
                catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid fields format. Must be valid JSON array",
                    });
                }
            }
            const existingCommand = await main_1.main.prisma.command.findFirst({
                where: {
                    guildId,
                    name,
                },
            });
            if (existingCommand) {
                return res.status(400).json({
                    success: false,
                    message: "A command with this name already exists in this guild",
                });
            }
            const created = await main_1.main.prisma.command.create({
                data: {
                    guildId,
                    name,
                    embed: embed || false,
                    embedColor: embedColor || "Red",
                    embedTitle: embedTitle || null,
                    embedFooter: embedFooter || null,
                    embedImage: embedImage || null,
                    embedThumbnail: embedThumbnail || null,
                    embedAuthor: embedAuthor || null,
                    buttons: buttons ? JSON.parse(buttons) : null,
                    file: file || null,
                    description: description || null,
                    fields: fields ? JSON.parse(fields) : null,
                    response: response || null,
                    isEnabled: true,
                },
            });
            console.debug("[Command][POST] Command created:", created.id);
            return res.status(201).json({
                success: true,
                message: "Command created successfully",
                data: created,
            });
        }
        catch (error) {
            console.error("[Command][POST] Error creating command:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create command",
                error: error.message,
            });
        }
    });
    /**
     * Update a command by ID.
     * @route PUT /dashboard/utils/commands/:commandId
     */
    app.put(formatRoute("commands/:commandId"), async (req, res) => {
        try {
            const { commandId } = req.params;
            const { name, embed, embedColor, embedTitle, embedFooter, embedImage, embedThumbnail, embedAuthor, buttons, fields, file, description, response, isEnabled, } = req.body;
            const existingCommand = await main_1.main.prisma.command.findUnique({
                where: { id: commandId },
            });
            if (!existingCommand) {
                console.debug(`[Command][PUT] Command not found: ${commandId}`);
                return res.status(404).json({
                    success: false,
                    message: "Command not found",
                });
            }
            // Check for name uniqueness in the same guild
            if (name && name !== existingCommand.name) {
                const nameExists = await main_1.main.prisma.command.findFirst({
                    where: {
                        guildId: existingCommand.guildId,
                        name,
                    },
                });
                if (nameExists) {
                    return res.status(400).json({
                        success: false,
                        message: "A command with this name already exists in this guild",
                    });
                }
            }
            // Validate buttons if provided
            let parsedButtons = null;
            if (buttons !== undefined) {
                try {
                    parsedButtons = buttons ? JSON.parse(buttons) : null;
                    if (parsedButtons && !Array.isArray(parsedButtons)) {
                        return res.status(400).json({
                            success: false,
                            message: "Buttons must be an array",
                        });
                    }
                    if (parsedButtons) {
                        for (const btn of parsedButtons) {
                            if (!btn.label || !btn.style) {
                                return res.status(400).json({
                                    success: false,
                                    message: "Each button must have label, style, and customId properties",
                                });
                            }
                        }
                    }
                }
                catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid buttons format. Must be valid JSON array",
                    });
                }
            }
            // Validate fields if provided
            let parsedFields = null;
            if (fields !== undefined) {
                try {
                    parsedFields = fields ? JSON.parse(fields) : null;
                    if (parsedFields && !Array.isArray(parsedFields)) {
                        return res.status(400).json({
                            success: false,
                            message: "Fields must be an array",
                        });
                    }
                    if (parsedFields) {
                        for (const field of parsedFields) {
                            if (!field.name || !field.value) {
                                return res.status(400).json({
                                    success: false,
                                    message: "Each field must have name and value properties",
                                });
                            }
                        }
                    }
                }
                catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid fields format. Must be valid JSON array",
                    });
                }
            }
            const updated = await main_1.main.prisma.command.update({
                where: { id: commandId },
                data: {
                    name: name || existingCommand.name,
                    embed: typeof embed === "boolean" ? embed : existingCommand.embed,
                    embedColor: embedColor || existingCommand.embedColor,
                    embedTitle: embedTitle !== undefined ? embedTitle : existingCommand.embedTitle,
                    embedFooter: embedFooter !== undefined ? embedFooter : existingCommand.embedFooter,
                    embedImage: embedImage !== undefined ? embedImage : existingCommand.embedImage,
                    embedThumbnail: embedThumbnail !== undefined ? embedThumbnail : existingCommand.embedThumbnail,
                    embedAuthor: embedAuthor !== undefined ? embedAuthor : existingCommand.embedAuthor,
                    buttons: buttons !== undefined ? parsedButtons : existingCommand.buttons,
                    file: file !== undefined ? file : existingCommand.file,
                    description: description !== undefined ? description : existingCommand.description,
                    response: response !== undefined ? response : existingCommand.response,
                    fields: fields !== undefined ? parsedFields : existingCommand.fields,
                    isEnabled: typeof isEnabled === "boolean" ? isEnabled : existingCommand.isEnabled,
                },
            });
            console.debug(`[Command][PUT] Command updated: ${commandId}`);
            return res.status(200).json({
                success: true,
                message: "Command updated successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("[Command][PUT] Error updating command:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update command",
                error: error.message,
            });
        }
    });
    /**
     * Delete a command by ID.
     * @route DELETE /dashboard/utils/commands/:commandId
     */
    app.delete(formatRoute("commands/:commandId"), async (req, res) => {
        try {
            const { commandId } = req.params;
            const existingCommand = await main_1.main.prisma.command.findUnique({
                where: { id: commandId },
            });
            if (!existingCommand) {
                console.debug(`[Command][DELETE] Command not found: ${commandId}`);
                return res.status(404).json({
                    success: false,
                    message: "Command not found",
                });
            }
            await main_1.main.prisma.command.delete({
                where: { id: commandId },
            });
            console.debug(`[Command][DELETE] Command deleted: ${commandId}`);
            return res.status(200).json({
                success: true,
                message: "Command deleted successfully",
            });
        }
        catch (error) {
            console.error("[Command][DELETE] Error deleting command:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete command",
                error: error.message,
            });
        }
    });
    /**
     * Toggle command status (enable/disable).
     * @route PATCH /dashboard/utils/commands/:commandId/toggle
     */
    app.patch(formatRoute("commands/:commandId/toggle"), async (req, res) => {
        try {
            const { commandId } = req.params;
            const existingCommand = await main_1.main.prisma.command.findUnique({
                where: { id: commandId },
            });
            if (!existingCommand) {
                console.debug(`[Command][PATCH] Command not found: ${commandId}`);
                return res.status(404).json({
                    success: false,
                    message: "Command not found",
                });
            }
            const updated = await main_1.main.prisma.command.update({
                where: { id: commandId },
                data: {
                    isEnabled: !existingCommand.isEnabled,
                },
            });
            console.debug(`[Command][PATCH] Command toggled: ${commandId}, new status: ${updated.isEnabled}`);
            return res.status(200).json({
                success: true,
                message: `Command ${updated.isEnabled ? "enabled" : "disabled"} successfully`,
                data: updated,
            });
        }
        catch (error) {
            console.error("[Command][PATCH] Error toggling command:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to toggle command status",
                error: error.message,
            });
        }
    });
    /**
     * Increment command usage count.
     * @route PATCH /dashboard/utils/commands/:commandId/usage
     */
    app.patch(formatRoute("commands/:commandId/usage"), async (req, res) => {
        try {
            const { commandId } = req.params;
            const existingCommand = await main_1.main.prisma.command.findUnique({
                where: { id: commandId },
            });
            if (!existingCommand) {
                console.debug(`[Command][PATCH] Command not found: ${commandId}`);
                return res.status(404).json({
                    success: false,
                    message: "Command not found",
                });
            }
            const updated = await main_1.main.prisma.command.update({
                where: { id: commandId },
                data: {
                    usageCount: existingCommand.usageCount + 1,
                },
            });
            console.debug(`[Command][PATCH] Command usage incremented: ${commandId}, new count: ${updated.usageCount}`);
            return res.status(200).json({
                success: true,
                message: "Command usage incremented",
                data: updated,
            });
        }
        catch (error) {
            console.error("[Command][PATCH] Error incrementing command usage:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to increment command usage",
                error: error.message,
            });
        }
    });
    app.get(formatRoute("commands"), async (_req, res) => {
        try {
            const commands = await main_1.main.prisma.command.findMany({
                orderBy: { createdAt: "desc" },
            });
            return res.status(200).json({ success: true, data: commands });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch commands",
                error: error.message,
            });
        }
    });
    app.get(formatRoute("nsfw-images"), async (_req, res) => {
        try {
            const dirPath = (0, path_1.join)(__dirname, "../../../../../../config/logs-apps/nsfw-image");
            const files = await (0, promises_1.readdir)(dirPath);
            // Extensiones soportadas (añadí formatos de video)
            const mediaExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];
            const images = await Promise.all(files
                .filter((file) => mediaExtensions.some((ext) => file.toLowerCase().endsWith(ext)))
                .map(async (file) => {
                const filePath = (0, path_1.join)(dirPath, file);
                const stats = (0, fs_1.statSync)(filePath);
                // Extraer nombre sin extensión para el título
                const nameWithoutExt = file.replace(/\.[^/.]+$/, "");
                // Determinar el tipo de medio
                const isVideo = [".mp4", ".webm"].some((ext) => file.toLowerCase().endsWith(ext));
                return {
                    id: file, // Usamos el nombre como ID único
                    url: `/dashboard/utils/nsfw-images/${file}`,
                    path: filePath,
                    name: nameWithoutExt.replace(/_/g, " "), // Formatear nombre más legible
                    size: Math.round(stats.size / 1024), // tamaño en KB
                    date: stats.mtime.toISOString(), // Fecha de modificación
                    type: isVideo ? "video" : "image",
                    category: "general", // Puedes categorizar basado en subcarpetas o nombres
                    tags: [], // Puedes extraer tags del nombre del archivo
                    views: 0, // Contador de vistas (podrías implementarlo)
                };
            }));
            res.json(images);
        }
        catch (err) {
            console.error("Error al leer las imágenes:", err);
            res.status(500).json({ error: "Error al leer las imágenes." });
        }
    });
    const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
    };
    app.get(formatRoute("nsfw-images/:imageName"), async (req, res) => {
        const { imageName } = req.params;
        const dirPath = (0, path_1.join)(__dirname, "../../../../../../config/logs-apps/nsfw-image");
        const filePath = (0, path_1.join)(dirPath, imageName);
        try {
            // Detecta la extensión real
            const ext = path_1.default.extname(imageName).toLowerCase();
            const contentType = mimeTypes[ext] || "application/octet-stream";
            const file = await (0, promises_1.readFile)(filePath);
            res.set("Content-Type", contentType);
            res.send(file);
        }
        catch (err) {
            console.error("Error al servir la imagen:", err);
            res.status(404).json({ error: "Imagen no encontrada." });
        }
    });
};
//# sourceMappingURL=utils.routes.js.map
//# debugId=6b64f315-5b65-56f5-9d41-2a3332af745b
