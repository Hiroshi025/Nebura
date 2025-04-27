"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const task_response_dto_1 = require("../../../../../server/domain/entitys/tasks/task-response.dto");
const task_service_1 = require("../../../../../server/domain/services/utilities/task.service");
const taskService = new task_service_1.TaskService();
class TaskController {
    async createTask(req, res) {
        try {
            const createTaskDto = req.body;
            const task = await taskService.createTask(createTaskDto);
            res.status(201).json(new task_response_dto_1.TaskResponseDto(task));
        }
        catch (error) {
            res.status(500).json({ message: req.t("errors:failed_to_create_task") });
        }
    }
    async getTask(req, res) {
        try {
            const { id } = req.params;
            const task = await taskService.getTaskById(id);
            if (!task) {
                return res.status(404).json({ message: req.t("errors:task_not_found") });
            }
            return res.json(new task_response_dto_1.TaskResponseDto(task));
        }
        catch (error) {
            return res.status(500).json({ message: req.t("errors:failed_to_fetch_task") });
        }
    }
    async getAllTasks(req, res) {
        try {
            const { status, priority, createdBy, tag } = req.query;
            const tasks = await taskService.getAllTasks({
                status: status,
                priority: priority,
                createdBy: createdBy,
                tag: tag,
            });
            res.json(tasks.map((task) => new task_response_dto_1.TaskResponseDto(task)));
        }
        catch (error) {
            res.status(500).json({ message: req.t("errors:failed_to_fetch_tasks") });
        }
    }
    async updateTask(req, res) {
        try {
            const { id } = req.params;
            const updateTaskDto = req.body;
            const task = await taskService.updateTask(id, updateTaskDto);
            res.json(new task_response_dto_1.TaskResponseDto(task));
        }
        catch (error) {
            res.status(500).json({ message: req.t("errors:failed_to_update_task") });
        }
    }
    async deleteTask(req, res) {
        try {
            const { id } = req.params;
            await taskService.deleteTask(id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ message: req.t("errors:failed_to_delete_task") });
        }
    }
}
exports.TaskController = TaskController;
