"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1f329c32-f7b4-5f81-8bb3-308774fd99fa")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
//TODO Agregar la parte de la logica de los recordatorios
class ReminderService {
    async getUpcomingReminders() {
        // Implementar lógica para obtener recordatorios próximos
        // Esto dependerá de cómo implementes las notificaciones
        return [];
    }
    async processRecurringTasks() {
        // Implementar lógica para crear nuevas tareas recurrentes
        // Esto podría ser llamado por un cron job
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminder.service.js.map
//# debugId=1f329c32-f7b4-5f81-8bb3-308774fd99fa
