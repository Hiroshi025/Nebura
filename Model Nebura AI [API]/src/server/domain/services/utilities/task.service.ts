import { main } from "@/main";

import { CreateTaskDto } from "../../entitys/tasks/create-task.dto";
import { Recurrence, Reminder, Task } from "../../entitys/tasks/task.entity";
import { UpdateTaskDto } from "../../entitys/tasks/update-task.dto";

export class TaskService {
  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = await main.prisma.task.create({
      data: {
        ...createTaskDto,
        recurrence: createTaskDto.recurrence ? JSON.stringify(createTaskDto.recurrence) : undefined,
        status: createTaskDto.status || "pending",
        priority: createTaskDto.priority || "medium",
        tags: createTaskDto.tags || [],
        reminder: createTaskDto.reminder ? JSON.stringify(createTaskDto.reminder) : undefined,
      },
    });
    return {
      ...task,
      recurrence: task.recurrence
        ? (JSON.parse(task.recurrence as string) as Recurrence)
        : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const task = await main.prisma.task.findUnique({
      where: { id },
    });
    return task as Task | null;
  }

  async getAllTasks(
    filters: {
      status?: string;
      priority?: string;
      createdBy?: string;
      tag?: string;
    } = {},
  ): Promise<Task[]> {
    const { status, priority, createdBy, tag } = filters;
    const tasks = await main.prisma.task.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(createdBy && { createdBy }),
        ...(tag && { tags: { has: tag } }),
      }
    });
    return tasks.map((task) => ({
      ...task,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
      recurrence: task.recurrence
        ? (JSON.parse(task.recurrence as string) as Recurrence)
        : undefined,
    })) as Task[];
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const data: any = { ...updateTaskDto };

    if (updateTaskDto.status === "completed") {
      data.completedAt = new Date();
    }

    const task = await main.prisma.task.update({
      where: { id },
      data,
    });
    return {
      ...task,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
      recurrence: task.recurrence
        ? (JSON.parse(task.recurrence as string) as Recurrence)
        : undefined,
    } as Task;
  }

  async deleteTask(id: string): Promise<void> {
    await main.prisma.task.delete({
      where: { id },
    });
  }

  async cleanUpTasks(): Promise<number> {
    const now = new Date();
    const result = await main.prisma.task.deleteMany({
      where: {
        autoDelete: {
          lte: now,
        },
      },
    });
    return result.count;
  }
}
