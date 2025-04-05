export interface Task {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: Date;
  status: 'pending' | 'completed' | 'canceled';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  reminder?: Reminder;
  recurrence?: Recurrence;
  autoDelete?: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Reminder {
  enabled: boolean;
  timeBefore: string; // e.g. "30 minutes"
  notified?: boolean;
}

export interface Recurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: Date;
  times?: number;
}