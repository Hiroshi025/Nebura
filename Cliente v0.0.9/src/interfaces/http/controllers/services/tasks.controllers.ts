import { Request, Response } from "express";

import { CreateTaskDto } from "@/interfaces/http/dtos/tasks/create-task.dto";
import { TaskResponseDto } from "@/interfaces/http/dtos/tasks/task-response.dto";
import { UpdateTaskDto } from "@domain/services/entities/tasks/update-task.dto";
import { TaskService } from "@domain/services/use-cases/utilities/task.service";

/**
 * Controller for handling task-related HTTP requests.
 *
 * Provides endpoints for creating, retrieving, updating, and deleting tasks.
 * Uses the TaskService for business logic and data persistence.
 *
 * @example
 * // Usage with Express:
 * app.post('/api/tasks', taskController.createTask);
 * app.get('/api/tasks/:id', taskController.getTask);
 * app.get('/api/tasks', taskController.getAllTasks);
 * app.put('/api/tasks/:id', taskController.updateTask);
 * app.delete('/api/tasks/:id', taskController.deleteTask);
 */
export class TaskController extends TaskService {
  /**
   * Creates a new task.
   *
   * Expects a CreateTaskDto in the request body.
   * Responds with the created task in TaskResponseDto format.
   *
   * @param req - Express Request object containing the task data.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the created task or error message.
   *
   * @example
   * // Request body:
   * // { "title": "New Task", "description": "...", ... }
   * // Response:
   * // { id: "...", title: "New Task", ... }
   */
  async createTask(req: Request, res: Response) {
    try {
      const createTaskDto: CreateTaskDto = req.body;
      const task = await this.create(createTaskDto);
      res.status(201).json(new TaskResponseDto(task));
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_create_task") });
    }
  }

  /**
   * Retrieves a task by its ID.
   *
   * Expects the task ID in the request parameters.
   * Responds with the task in TaskResponseDto format or a 404 if not found.
   *
   * @param req - Express Request object with task ID in params.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the task or error message.
   *
   * @example
   * // GET /api/tasks/123
   * // Response:
   * // { id: "123", title: "Task Title", ... }
   */
  async getTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await this.getById(id);
      if (!task) {
        return res.status(404).json({ message: req.t("errors:task_not_found") });
      }
      return res.json(new TaskResponseDto(task));
    } catch (error) {
      return res.status(500).json({ message: req.t("errors:failed_to_fetch_task") });
    }
  }

  /**
   * Retrieves all tasks, optionally filtered by status, priority, creator, or tag.
   *
   * Accepts query parameters for filtering.
   * Responds with an array of TaskResponseDto objects.
   *
   * @param req - Express Request object with optional query filters.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the list of tasks or error message.
   *
   * @example
   * // GET /api/tasks?status=completed&priority=high
   * // Response:
   * // [ { id: "...", title: "...", ... }, ... ]
   */
  async getAllTasks(req: Request, res: Response) {
    try {
      // Cambia 'tags' por 'tag' para que coincida con el tipo Task
      const { status, priority, createdBy, tag } = req.query as any;
      const tasks = await this.get({
        status: status,
        priority: priority,
        createdBy: createdBy,
        tag: tag,
      });
      return res.json(tasks.map((task) => new TaskResponseDto(task)));
    } catch (error) {
      return res.status(500).json({ message: req.t("errors:failed_to_fetch_tasks") });
    }
  }

  /**
   * Updates an existing task by its ID.
   *
   * Expects the task ID in the request parameters and an UpdateTaskDto in the body.
   * Responds with the updated task in TaskResponseDto format.
   *
   * @param req - Express Request object with task ID in params and update data in body.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the updated task or error message.
   *
   * @example
   * // PUT /api/tasks/123
   * // Request body:
   * // { "title": "Updated Title", ... }
   * // Response:
   * // { id: "123", title: "Updated Title", ... }
   */
  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateTaskDto: UpdateTaskDto = req.body;
      const task = await this.update(id, updateTaskDto);
      res.json(new TaskResponseDto(task));
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_update_task") });
    }
  }

  /**
   * Deletes a task by its ID.
   *
   * Expects the task ID in the request parameters.
   * Responds with HTTP 204 No Content on success.
   *
   * @param req - Express Request object with task ID in params.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a 204 status or error message.
   *
   * @example
   * // DELETE /api/tasks/123
   * // Response: 204 No Content
   */
  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_delete_task") });
    }
  }
}
