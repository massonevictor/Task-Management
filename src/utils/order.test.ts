import { describe, expect, test } from 'vitest';
import type { Task } from '../types';
import {
  computeTaskPositionAfterReorder,
  completeTask,
  summarizeExport,
  POSITION_GAP,
  positionForStatusChange,
} from './order';

const baseTasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'A',
    priority: 'medium',
    done: false,
    position: POSITION_GAP,
    createdAt: 1,
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'B',
    priority: 'medium',
    done: false,
    position: POSITION_GAP * 2,
    createdAt: 2,
  },
  {
    id: 't3',
    projectId: 'p2',
    title: 'C',
    priority: 'medium',
    done: false,
    position: POSITION_GAP,
    createdAt: 3,
  },
];

describe('order helpers', () => {
  test('reordering ignores cross-project moves', () => {
    const position = computeTaskPositionAfterReorder(baseTasks, 't1', 't3');
    expect(position).toBeNull();
  });

  test('reordering ignores mixing finished and active tasks', () => {
    const tasks = [
      ...baseTasks,
      { ...baseTasks[0], id: 'done', done: true, position: POSITION_GAP * 5 },
    ];
    const position = computeTaskPositionAfterReorder(tasks, 't2', 'done');
    expect(position).toBeNull();
  });

  test('completeTask toggles timestamps', () => {
    const toggled = completeTask(baseTasks[0], true);
    expect(toggled.done).toBe(true);
    expect(typeof toggled.completedAt).toBe('number');

    const undone = completeTask(toggled, false);
    expect(undone.done).toBe(false);
    expect(undone.completedAt).toBeUndefined();
  });

  test('summarizeExport counts relations', () => {
    const summary = summarizeExport(
      [
        { id: 'p1', title: 'Projeto 1', position: 1, createdAt: 0 },
        { id: 'p2', title: 'Projeto 2', position: 2, createdAt: 0 },
      ],
      baseTasks,
    );

    expect(summary.projectCount).toBe(2);
    expect(summary.taskCount).toBe(3);
    expect(summary.byProject.find((row) => row.projectId === 'p1')?.tasks).toBe(2);
    expect(summary.byProject.find((row) => row.projectId === 'p2')?.tasks).toBe(1);
  });

  test('positionForStatusChange pushes completed tasks to the end', () => {
    const task = baseTasks[0];
    const position = positionForStatusChange(baseTasks, task, true);
    expect(position).toBeGreaterThan(baseTasks[1].position);
  });

  test('positionForStatusChange brings reactivated tasks to the start', () => {
    const doneTask: Task = { ...baseTasks[0], done: true, position: POSITION_GAP * 10 };
    const tasks = [doneTask, baseTasks[1]];
    const position = positionForStatusChange(tasks, doneTask, false);
    expect(position).toBeLessThan(baseTasks[1].position);
  });
});
