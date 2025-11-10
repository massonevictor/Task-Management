import { create } from 'zustand';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { FiltersState, Priority, Project, Task } from '../types';
import { applyTaskFilters } from '../utils/filters';
import {
  completeTask,
  computeTaskPositionAfterReorder,
  getNextPosition,
  getPositionBetween,
  nextTaskPositionForProject,
  positionForStatusChange,
  reorderArray,
} from '../utils/order';
import { exportSchema } from '../schema';
import { api } from '../api/client';

type Theme = 'light' | 'dark';

const defaultFilters: FiltersState = {
  query: '',
  priority: 'all',
  status: 'all',
};

const preferredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('tm-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export interface AppState {
  ready: boolean;
  projects: Project[];
  tasks: Task[];
  filters: FiltersState;
  theme: Theme;
  selectedTaskId?: string;
  lastUsedProjectId?: string;
  load: () => Promise<void>;
  addProject: (title: string) => Promise<void>;
  updateProject: (id: string, title: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  reorderProjects: (activeId: string, overId: string) => Promise<void>;
  addTask: (input: {
    projectId: string;
    title: string;
    description?: string;
    priority: Priority;
  }) => Promise<void>;
  updateTask: (id: string, input: Partial<Omit<Task, 'id' | 'projectId'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (activeId: string, overId: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  setFilters: (partial: Partial<FiltersState>) => void;
  setSearchQuery: (query: string) => void;
  setTheme: (theme: Theme) => void;
  setSelection: (taskId?: string) => void;
  getVisibleTasks: (projectId: string) => Task[];
  getProjectById: (projectId: string) => Project | undefined;
  exportBackup: () => Promise<string>;
  importBackup: (payload: string) => Promise<void>;
}

async function reloadWithError(message: string, error: unknown, load: () => Promise<void>) {
  console.error(error);
  toast.error(message);
  await load();
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  projects: [],
  tasks: [],
  filters: defaultFilters,
  theme: preferredTheme(),
  selectedTaskId: undefined,
  lastUsedProjectId: undefined,
  async load() {
    try {
      const data = await api.getState();
      set({
        projects: data.projects,
        tasks: data.tasks,
        ready: true,
        lastUsedProjectId: data.projects[0]?.id,
      });
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar os dados');
    }
  },
  async addProject(title) {
    const current = get().projects;
    const project: Project = {
      id: nanoid(),
      title,
      createdAt: Date.now(),
      position: getNextPosition(current),
    };
    set({ projects: [...current, project], lastUsedProjectId: project.id });
    try {
      const saved = await api.createProject(project);
      set((state) => ({
        projects: state.projects.map((item) => (item.id === saved.id ? saved : item)),
      }));
      toast.success('Projeto criado');
    } catch (error) {
      await reloadWithError('Não foi possível criar o projeto', error, get().load);
    }
  },
  async updateProject(id, title) {
    set({
      projects: get().projects.map((project) =>
        project.id === id ? { ...project, title } : project,
      ),
    });
    try {
      await api.updateProject(id, { title });
      toast.success('Projeto atualizado');
    } catch (error) {
      await reloadWithError('Não foi possível atualizar o projeto', error, get().load);
    }
  },
  async deleteProject(id) {
    set({
      projects: get().projects.filter((project) => project.id !== id),
      tasks: get().tasks.filter((task) => task.projectId !== id),
      selectedTaskId: undefined,
    });
    try {
      await api.deleteProject(id);
      toast.success('Projeto removido');
    } catch (error) {
      await reloadWithError('Não foi possível remover o projeto', error, get().load);
    }
  },
  async reorderProjects(activeId, overId) {
    const ordered = reorderArray(get().projects, activeId, overId);
    const idx = ordered.findIndex((project) => project.id === activeId);
    if (idx === -1) return;
    const prev = ordered[idx - 1]?.position;
    const next = ordered[idx + 1]?.position;
    const newPosition = getPositionBetween(prev, next);
    const updated = ordered.map((project) =>
      project.id === activeId ? { ...project, position: newPosition } : project,
    );
    set({ projects: updated });
    try {
      await api.updateProject(activeId, { position: newPosition });
    } catch (error) {
      await reloadWithError('Falha ao reordenar projeto', error, get().load);
    }
  },
  async addTask({ projectId, title, description, priority }) {
    const tasks = get().tasks;
    const task: Task = {
      id: nanoid(),
      projectId,
      title,
      description,
      priority,
      done: false,
      createdAt: Date.now(),
      position: nextTaskPositionForProject(tasks, projectId),
    };
    set({
      tasks: [...tasks, task],
      lastUsedProjectId: projectId,
    });
    try {
      const saved = await api.createTask(task);
      set((state) => ({
        tasks: state.tasks.map((item) => (item.id === saved.id ? saved : item)),
      }));
      toast.success('Tarefa criada');
    } catch (error) {
      await reloadWithError('Não foi possível criar a tarefa', error, get().load);
    }
  },
  async updateTask(id, input) {
    const nextTasks = get().tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            ...input,
          }
        : task,
    );
    set({ tasks: nextTasks });
    try {
      await api.updateTask(id, input);
      toast.success('Tarefa atualizada');
    } catch (error) {
      await reloadWithError('Não foi possível atualizar a tarefa', error, get().load);
    }
  },
  async deleteTask(id) {
    const { selectedTaskId } = get();
    set({
      tasks: get().tasks.filter((task) => task.id !== id),
      selectedTaskId: selectedTaskId === id ? undefined : selectedTaskId,
    });
    try {
      await api.deleteTask(id);
      toast.success('Tarefa excluída');
    } catch (error) {
      await reloadWithError('Não foi possível excluir a tarefa', error, get().load);
    }
  },
  async reorderTasks(activeId, overId) {
    const newPosition = computeTaskPositionAfterReorder(get().tasks, activeId, overId);
    if (newPosition == null) return;
    set({
      tasks: get().tasks.map((task) =>
        task.id === activeId ? { ...task, position: newPosition } : task,
      ),
    });
    try {
      await api.updateTask(activeId, { position: newPosition });
    } catch (error) {
      await reloadWithError('Falha ao reordenar tarefa', error, get().load);
    }
  },
  async toggleTask(id) {
    const current = get().tasks.find((task) => task.id === id);
    if (!current) return;
    const toggled = completeTask(current, !current.done);
    const newPosition = positionForStatusChange(get().tasks, current, toggled.done);
    const updated = {
      ...toggled,
      position: newPosition ?? current.position,
    };
    set({
      tasks: get().tasks.map((task) => (task.id === id ? updated : task)),
    });
    try {
      await api.updateTask(id, {
        done: updated.done,
        completedAt: updated.completedAt ?? null,
        position: updated.position,
      });
    } catch (error) {
      await reloadWithError('Não foi possível atualizar o status da tarefa', error, get().load);
    }
  },
  setFilters(partial) {
    set((state) => ({
      filters: {
        ...state.filters,
        ...partial,
      },
    }));
  },
  setSearchQuery(query) {
    set((state) => ({
      filters: {
        ...state.filters,
        query,
      },
    }));
  },
  setTheme(theme) {
    set({ theme });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tm-theme', theme);
    }
  },
  setSelection(taskId) {
    set({ selectedTaskId: taskId });
  },
  getVisibleTasks(projectId) {
    const { tasks, filters } = get();
    const scoped = tasks.filter((task) => task.projectId === projectId);
    return applyTaskFilters(scoped, filters).sort((a, b) => a.position - b.position);
  },
  getProjectById(projectId) {
    return get().projects.find((project) => project.id === projectId);
  },
  async exportBackup() {
    const data = await api.exportData();
    return JSON.stringify(data, null, 2);
  },
  async importBackup(payload: string) {
    const parsed = exportSchema.parse(JSON.parse(payload));
    const state = await api.importData(parsed);
    const { projects, tasks } = state;
    set({
      projects,
      tasks,
      lastUsedProjectId: projects[0]?.id,
    });
    toast.success('Backup importado');
  },
}));
