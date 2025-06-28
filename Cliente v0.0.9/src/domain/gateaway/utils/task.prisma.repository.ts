import { main } from "@/main";
import { Recurrence, Reminder, Task } from "@domain/entities/tasks/task.entity";
import { ITaskPort } from "@domain/ports/services/task.repository.port"; // Importa el puerto
import { TaskQueryFilters } from "@typings/modules/api";
import { CreateTask } from "@typings/services/tasks";

/**
 * Implementación de ITaskPort usando Prisma.
 */
export class TaskRepository implements ITaskPort {
  async create(data: CreateTask) {
    const task = await main.prisma.task.create({ data });
    return {
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = await main.prisma.task.findUnique({ where: { id } });
    if (!task) return null;
    return {
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  async findMany(filters: TaskQueryFilters = {}): Promise<Task[]> {
    const { status, priority, createdBy, tag } = filters;
    const tasks = await main.prisma.task.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(createdBy && { createdBy }),
        ...(tag && { tags: { has: tag } }),
      },
    });
    return tasks.map((task) => ({
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    })) as Task[];
  }

  async update(id: string, data: Partial<CreateTask>) {
    const task = await main.prisma.task.update({ where: { id }, data });
    return {
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  async delete(id: string): Promise<void> {
    await main.prisma.task.delete({ where: { id } });
  }

  async deleteManyAutoDeleteBefore(date: Date): Promise<number> {
    const result = await main.prisma.task.deleteMany({
      where: { autoDelete: { lte: date.toISOString() } },
    });
    return result.count;
  }
}
