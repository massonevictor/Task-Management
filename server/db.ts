import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Project, Task } from '../src/types';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    position REAL NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    position REAL NOT NULL,
    createdAt INTEGER NOT NULL,
    completedAt INTEGER,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_project_position ON tasks (projectId, position);
  CREATE INDEX IF NOT EXISTS idx_projects_position ON projects (position);
`);

const projectSelectAll = db.prepare('SELECT id, title, position, createdAt FROM projects ORDER BY position ASC');
const taskSelectAll = db.prepare('SELECT id, projectId, title, description, priority, done, position, createdAt, completedAt FROM tasks ORDER BY projectId ASC, position ASC');
const projectSelect = db.prepare('SELECT id, title, position, createdAt FROM projects WHERE id = ?');
const taskSelect = db.prepare('SELECT id, projectId, title, description, priority, done, position, createdAt, completedAt FROM tasks WHERE id = ?');

type TaskRow = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  priority: Task['priority'];
  done: number;
  position: number;
  createdAt: number;
  completedAt?: number | null;
};

function mapTask(row: TaskRow): Task {
  return {
    ...row,
    description: row.description ?? undefined,
    done: Boolean(row.done),
    completedAt: row.completedAt ?? undefined,
  };
}

export function getState(): { projects: Project[]; tasks: Task[] } {
  const projects = projectSelectAll.all() as Project[];
  const tasks = (taskSelectAll.all() as TaskRow[]).map(mapTask);
  return { projects, tasks };
}

export function insertProject(project: Project) {
  db.prepare(
    `INSERT INTO projects (id, title, position, createdAt)
     VALUES (@id, @title, @position, @createdAt)`,
  ).run(project);
  return getProject(project.id);
}

export function updateProject(id: string, updates: Partial<Pick<Project, 'title' | 'position'>>) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (!entries.length) return getProject(id);
  const assignments = entries.map(([field], index) => `${field} = @value${index}`);
  const stmt = db.prepare(
    `UPDATE projects SET ${assignments.join(', ')} WHERE id = @id`,
  );
  stmt.run({
    id,
    ...Object.fromEntries(entries.map(([, value], index) => [`value${index}`, value])),
  });
  return getProject(id);
}

export function deleteProject(id: string) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function insertTask(task: Task) {
  db.prepare(
    `INSERT INTO tasks (id, projectId, title, description, priority, done, position, createdAt, completedAt)
     VALUES (@id, @projectId, @title, @description, @priority, @done, @position, @createdAt, @completedAt)`,
  ).run({
    ...task,
    description: task.description ?? null,
    done: task.done ? 1 : 0,
    completedAt: task.completedAt ?? null,
  });
  return getTask(task.id);
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>,
) {
  const normalized = { ...updates } as Record<string, unknown>;
  if (normalized.done !== undefined) {
    normalized.done = normalized.done ? 1 : 0;
  }
  const entries = Object.entries(normalized).filter(([, value]) => value !== undefined);
  if (!entries.length) return getTask(id);
  const assignments = entries.map(([field], index) => `${field} = @value${index}`);
  const stmt = db.prepare(
    `UPDATE tasks SET ${assignments.join(', ')} WHERE id = @id`,
  );
  stmt.run({
    id,
    ...Object.fromEntries(entries.map(([, value], index) => [`value${index}`, value])),
  });
  return getTask(id);
}

export function deleteTask(id: string) {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function replaceAll(data: { projects: Project[]; tasks: Task[] }) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM projects').run();

    const insertProjectStmt = db.prepare(
      `INSERT INTO projects (id, title, position, createdAt)
       VALUES (@id, @title, @position, @createdAt)`,
    );
    const insertTaskStmt = db.prepare(
      `INSERT INTO tasks (id, projectId, title, description, priority, done, position, createdAt, completedAt)
       VALUES (@id, @projectId, @title, @description, @priority, @done, @position, @createdAt, @completedAt)`,
    );

    for (const project of data.projects) {
      insertProjectStmt.run(project);
    }
    for (const task of data.tasks) {
      insertTaskStmt.run({
        ...task,
        description: task.description ?? null,
        done: task.done ? 1 : 0,
        completedAt: task.completedAt ?? null,
      });
    }
  });

  transaction();
  return getState();
}

export function getProject(id: string) {
  return projectSelect.get(id) as Project | undefined;
}

export function getTask(id: string) {
  const row = taskSelect.get(id) as TaskRow | undefined;
  return row ? mapTask(row) : undefined;
}
