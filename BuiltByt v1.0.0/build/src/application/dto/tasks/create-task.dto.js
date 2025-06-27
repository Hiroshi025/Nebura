"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="72345302-5989-5702-a3de-d25fc6e58b75")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTaskDto = void 0;
class CreateTaskDto {
    title = "";
    description;
    createdBy = "";
    dueDate;
    status;
    priority;
    tags;
    reminder;
    recurrence;
    autoDelete;
}
exports.CreateTaskDto = CreateTaskDto;
//# sourceMappingURL=create-task.dto.js.map
//# debugId=72345302-5989-5702-a3de-d25fc6e58b75
