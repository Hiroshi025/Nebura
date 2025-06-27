"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="c5b80ebc-b121-534d-b39b-81d3847c01f0")}catch(e){}}();

// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
const token_middleware_1 = require("../../../../../interfaces/http/middlewares/jwt/token.middleware");
const rateLimit_1 = require("../../../../../interfaces/messaging/broker/rateLimit");
const reminder_controllers_1 = require("../../../controllers/asistent/reminder.controllers");
const tasks_controllers_1 = require("../../../controllers/asistent/tasks.controllers");
// Constantes para paths base y versionado
const BASE_PATH = "/service";
const API_VERSION = "/api/v1";
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `${API_VERSION}${BASE_PATH}${path}`;
exports.default = ({ app }) => {
    const taskController = new tasks_controllers_1.TaskController();
    const reminderController = new reminder_controllers_1.ReminderController();
    /**
     * Crea una nueva tarea.
     * Método: POST
     * Ruta: /api/v1/service/tasks
     * Middleware: authenticateToken
     * Controlador: taskController.createTask
     * Descripción: Permite crear una nueva tarea.
     */
    app.post(formatRoute("/tasks"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, taskController.createTask.bind(taskController));
    /**
     * Obtiene una tarea específica por su ID.
     * Método: GET
     * Ruta: /api/v1/service/tasks/:id
     * Middleware: authenticateToken
     * Controlador: taskController.getTask
     * Descripción: Devuelve los detalles de una tarea específica.
     */
    app.get(formatRoute("/tasks/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, taskController.getTask.bind(taskController));
    /**
     * Obtiene todas las tareas.
     * Método: GET
     * Ruta: /api/v1/service/tasks
     * Middleware: authenticateToken
     * Controlador: taskController.getAllTasks
     * Descripción: Devuelve una lista de todas las tareas.
     */
    app.get(formatRoute("/tasks"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, taskController.getAllTasks.bind(taskController));
    /**
     * Actualiza una tarea específica por su ID.
     * Método: PATCH
     * Ruta: /api/v1/service/tasks/:id
     * Middleware: authenticateToken
     * Controlador: taskController.updateTask
     * Descripción: Permite actualizar los detalles de una tarea específica.
     */
    app.patch(formatRoute("/tasks/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, taskController.updateTask.bind(taskController));
    /**
     * Elimina una tarea específica por su ID.
     * Método: DELETE
     * Ruta: /api/v1/service/tasks/:id
     * Middleware: authenticateToken
     * Controlador: taskController.deleteTask
     * Descripción: Permite eliminar una tarea específica.
     */
    app.delete(formatRoute("/tasks/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, taskController.deleteTask.bind(taskController));
    /**
     * Obtiene recordatorios próximos.
     * Método: GET
     * Ruta: /reminders
     * Middleware: authenticateToken
     * Controlador: reminderController.getUpcomingReminders
     * Descripción: Devuelve una lista de recordatorios próximos.
     */
    app.get("/reminders", rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, reminderController.getUpReminders.bind(reminderController));
};
//# sourceMappingURL=tasks.routes.js.map
//# debugId=c5b80ebc-b121-534d-b39b-81d3847c01f0
