export type Task = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "completed" | "canceled";
  priority: "low" | "medium" | "high";
  tags?: string[];
  createdBy: string;
  dueDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  reminder?: Reminder;
  recurrence?: Recurrence;
  autoDelete?: string | Date;
};

export interface CreateTask {
  title: string;
  description?: string;
  createdBy: string;
  dueDate?: string | Date;
  status?: "pending" | "completed" | "canceled";
  priority?: "low" | "medium" | "high";
  tags?: string[];
  reminder?: Reminder;
  recurrence?: Recurrence;
  autoDelete?: string | Date;
}
