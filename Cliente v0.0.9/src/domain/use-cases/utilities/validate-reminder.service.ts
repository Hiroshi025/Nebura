import { Task } from "@domain/entities/tasks/task.entity";

//TODO Agregar la parte de la logica de los recordatorios
export class ReminderService {
  async getUpcomingReminders(): Promise<Task[]> {
    // Implementar lógica para obtener recordatorios próximos
    // Esto dependerá de cómo implementes las notificaciones
    return [];
  }

  async processRecurringTasks(): Promise<void> {
    // Implementar lógica para crear nuevas tareas recurrentes
    // Esto podría ser llamado por un cron job
  }
}
