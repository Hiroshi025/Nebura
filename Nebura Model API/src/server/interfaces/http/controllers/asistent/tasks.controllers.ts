import { Request, Response } from "express";

import { CreateTaskDto } from "@/server/domain/entitys/tasks/create-task.dto";
import { TaskResponseDto } from "@/server/domain/entitys/tasks/task-response.dto";
import { UpdateTaskDto } from "@/server/domain/entitys/tasks/update-task.dto";
import { TaskService } from "@/server/domain/services/utilities/task.service";

const taskService = new TaskService();

export class TaskController {
  async createTask(req: Request, res: Response) {
    try {
      const createTaskDto: CreateTaskDto = req.body;
      const task = await taskService.createTask(createTaskDto);
      res.status(201).json(new TaskResponseDto(task));
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_create_task") });
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: req.t("errors:task_not_found") });
      }
      return res.json(new TaskResponseDto(task));
    } catch (error) {
      return res.status(500).json({ message: req.t("errors:failed_to_fetch_task") });
    }
  }

  async getAllTasks(req: Request, res: Response) {
    try {
      const { status, priority, createdBy, tag } = req.query;
      const tasks = await taskService.getAllTasks({
        status: status as string,
        priority: priority as string,
        createdBy: createdBy as string,
        tag: tag as string,
      });
      res.json(tasks.map((task) => new TaskResponseDto(task)));
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_fetch_tasks") });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateTaskDto: UpdateTaskDto = req.body;
      const task = await taskService.updateTask(id, updateTaskDto);
      res.json(new TaskResponseDto(task));
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_update_task") });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await taskService.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_delete_task") });
    }
  }
}
