import { Recurrence, Reminder } from "./task.entity";

export class UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: 'pending' | 'completed' | 'canceled';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  reminder?: Reminder | null;
  recurrence?: Recurrence | null;
  autoDelete?: Date | null;
}