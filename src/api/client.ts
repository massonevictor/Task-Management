import type { ExportPayload } from '../schema';
import type { Project, Task } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getState: () => request<{ projects: Project[]; tasks: Task[] }>('/state'),
  createProject: (project: Project) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(project) }),
  updateProject: (id: string, input: Partial<Pick<Project, 'title' | 'position'>>) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  createTask: (task: Task) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (
    id: string,
    input: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>,
  ) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  exportData: () => request<ExportPayload>('/export'),
  importData: (payload: ExportPayload) =>
    request<ExportPayload>('/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export type { Project, Task } from '../types';
