import { Task } from "@domain/entities/tasks/task.entity";
import { TaskQueryFilters } from "@typings/modules/api";
import { CreateTask } from "@typings/services/tasks";

export interface ITaskPort {
  create(data: CreateTask): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findMany(filters?: TaskQueryFilters): Promise<Task[]>;
  update(id: string, data: Partial<CreateTask>): Promise<Task>;
  delete(id: string): Promise<void>;
  deleteManyAutoDeleteBefore(date: Date): Promise<number>;
}