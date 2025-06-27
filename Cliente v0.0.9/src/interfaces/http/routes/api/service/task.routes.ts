// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { authenticateToken } from "@/interfaces/http/middlewares/jwt/token.middleware";
import { RateLimitManager } from "@/interfaces/messaging/broker/rateLimit";
import { TRoutesInput } from "@/typings/utils";

import { ReminderController } from "../../../controllers/services/reminder.controllers";
import { TaskController } from "../../../controllers/services/tasks.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/service";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const taskController = new TaskController();
  const reminderController = new ReminderController();

  /**
   * Crea una nueva tarea.
   * Método: POST
   * Ruta: /api/v1/service/tasks
   * Middleware: authenticateToken
   * Controlador: taskController.createTask
   * Descripción: Permite crear una nueva tarea.
   */
  app.post(
    formatRoute("/tasks"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    taskController.createTask.bind(taskController),
  );

  /**
   * Obtiene una tarea específica por su ID.
   * Método: GET
   * Ruta: /api/v1/service/tasks/:id
   * Middleware: authenticateToken
   * Controlador: taskController.getTask
   * Descripción: Devuelve los detalles de una tarea específica.
   */
  app.get(
    formatRoute("/tasks/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    taskController.getTask.bind(taskController),
  );

  /**
   * Obtiene todas las tareas.
   * Método: GET
   * Ruta: /api/v1/service/tasks
   * Middleware: authenticateToken
   * Controlador: taskController.getAllTasks
   * Descripción: Devuelve una lista de todas las tareas.
   */
  app.get(
    formatRoute("/tasks"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    taskController.getAllTasks.bind(taskController),
  );

  /**
   * Actualiza una tarea específica por su ID.
   * Método: PATCH
   * Ruta: /api/v1/service/tasks/:id
   * Middleware: authenticateToken
   * Controlador: taskController.updateTask
   * Descripción: Permite actualizar los detalles de una tarea específica.
   */
  app.patch(
    formatRoute("/tasks/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    taskController.updateTask.bind(taskController),
  );

  /**
   * Elimina una tarea específica por su ID.
   * Método: DELETE
   * Ruta: /api/v1/service/tasks/:id
   * Middleware: authenticateToken
   * Controlador: taskController.deleteTask
   * Descripción: Permite eliminar una tarea específica.
   */
  app.delete(
    formatRoute("/tasks/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    taskController.deleteTask.bind(taskController),
  );

  /**
   * Obtiene recordatorios próximos.
   * Método: GET
   * Ruta: /reminders
   * Middleware: authenticateToken
   * Controlador: reminderController.getUpcomingReminders
   * Descripción: Devuelve una lista de recordatorios próximos.
   */
  app.get(
    "/reminders",
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    reminderController.getUpReminders.bind(reminderController),
  );
};
