export type Priority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  title: string;
  position: number;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: Priority;
  done: boolean;
  position: number;
  createdAt: number;
  completedAt?: number | null;
}

export type StatusFilter = 'all' | 'active' | 'done';

export interface FiltersState {
  query: string;
  priority: Priority | 'all';
  status: StatusFilter;
}
