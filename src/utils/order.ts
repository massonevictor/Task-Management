import type { Project, Task } from '../types';

export const POSITION_GAP = 1000;

interface Positionable {
  position: number;
}

export function getNextPosition<T extends Positionable>(items: T[]) {
  if (!items.length) return POSITION_GAP;
  return items[items.length - 1].position + POSITION_GAP;
}

export function getPositionBetween(prev?: number, next?: number) {
  if (prev == null && next == null) return POSITION_GAP;
  if (prev == null) return (next ?? POSITION_GAP) - POSITION_GAP;
  if (next == null) return prev + POSITION_GAP;
  return prev + (next - prev) / 2;
}

export function reorderArray<T extends { id: string }>(items: T[], activeId: string, overId: string) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);
  if (activeIndex === -1 || overIndex === -1) return items;
  const updated = [...items];
  const [moved] = updated.splice(activeIndex, 1);
  updated.splice(overIndex, 0, moved);
  return updated;
}

export function nextTaskPositionForProject(tasks: Task[], projectId: string) {
  const scoped = tasks.filter((task) => task.projectId === projectId).sort((a, b) => a.position - b.position);
  return getNextPosition(scoped);
}

export function recalcPositions<T extends Positionable & { id: string }>(items: T[]) {
  return items.map((item, idx) => ({
    ...item,
    position: (idx + 1) * POSITION_GAP,
  }));
}

export function ensureSameProject(tasks: Task[], activeId: string, overId: string) {
  const active = tasks.find((task) => task.id === activeId);
  const over = tasks.find((task) => task.id === overId);
  if (!active || !over) return false;
  return active.projectId === over.projectId;
}

export function computeTaskPositionAfterReorder(tasks: Task[], activeId: string, overId: string) {
  const activeTask = tasks.find((task) => task.id === activeId);
  const overTask = tasks.find((task) => task.id === overId);
  if (!activeTask || !overTask) {
    return null;
  }
  if (!ensureSameProject(tasks, activeId, overId)) {
    return null;
  }
  if (activeTask.done !== overTask.done) {
    return null;
  }
  const ordered = tasks
    .filter((task) => task.projectId === activeTask.projectId && task.done === activeTask.done)
    .sort((a, b) => a.position - b.position);
  const reordered = reorderArray(ordered, activeId, overId);
  const index = reordered.findIndex((task) => task.id === activeId);
  const prev = reordered[index - 1]?.position;
  const next = reordered[index + 1]?.position;
  return getPositionBetween(prev, next);
}

export function completeTask(task: Task, done: boolean): Task {
  return {
    ...task,
    done,
    completedAt: done ? Date.now() : undefined,
  };
}

export function summarizeExport(projects: Project[], tasks: Task[]) {
  return {
    projectCount: projects.length,
    taskCount: tasks.length,
    byProject: projects.map((project) => ({
      projectId: project.id,
      tasks: tasks.filter((task) => task.projectId === project.id).length,
    })),
  };
}

export function positionForStatusChange(tasks: Task[], task: Task, done: boolean) {
  const siblings = tasks
    .filter((item) => item.projectId === task.projectId && item.id !== task.id)
    .sort((a, b) => a.position - b.position);
  if (!siblings.length) {
    return POSITION_GAP;
  }
  if (done) {
    const last = siblings[siblings.length - 1];
    return last.position + POSITION_GAP;
  }
  const firstActive = siblings.find((item) => !item.done);
  if (!firstActive) {
    return POSITION_GAP;
  }
  return getPositionBetween(undefined, firstActive.position);
}
