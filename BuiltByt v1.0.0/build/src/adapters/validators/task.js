"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3b0681c6-a867-5db1-aa4d-ea46cc1fab71")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskReminder = exports.TaskRecurrence = void 0;
const zod_1 = require("zod");
exports.TaskRecurrence = zod_1.z.object({
    type: zod_1.z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: zod_1.z.number().optional(),
    endDate: zod_1.z.date().optional(),
    times: zod_1.z.number().optional(),
});
exports.TaskReminder = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    timeBefore: zod_1.z.string(), // e.g. "30 minutes"
    notified: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=task.js.map
//# debugId=3b0681c6-a867-5db1-aa4d-ea46cc1fab71
