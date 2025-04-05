// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { authenticateToken } from "@/server/shared/middlewares/jwt/token.middleware";
import { TRoutesInput } from "@/typings/utils";

import { ReminderController } from "../../../controllers/asistent/reminder.controllers";
import { TaskController } from "../../../controllers/asistent/tasks.controllers";

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

  app.post(
    formatRoute("/tasks"),
    authenticateToken,
    taskController.createTask.bind(taskController),
  );
  app.get(
    formatRoute("/tasks/:id"),
    authenticateToken,
    taskController.getTask.bind(taskController),
  );
  app.get(
    formatRoute("/tasks"),
    authenticateToken,
    taskController.getAllTasks.bind(taskController),
  );
  app.patch(
    formatRoute("/tasks/:id"),
    authenticateToken,
    taskController.updateTask.bind(taskController),
  );
  app.delete(
    formatRoute("/tasks/:id"),
    authenticateToken,
    taskController.deleteTask.bind(taskController),
  );

  app.get(
    "/reminders",
    authenticateToken,
    reminderController.getUpcomingReminders.bind(reminderController),
  );
};
