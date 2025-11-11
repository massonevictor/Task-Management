import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { ZodError, z } from 'zod';
import { projectSchema, taskSchema, prioritySchema, exportSchema } from '../src/schema';
import {
  deleteProject,
  deleteTask,
  getState,
  insertProject,
  insertTask,
  replaceAll,
  updateProject,
  updateTask,
} from './db';

const app = express();
app.use(cors());
app.use(express.json());

const projectUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    position: z.number().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

const taskUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: prioritySchema.optional(),
    done: z.boolean().optional(),
    position: z.number().optional(),
    completedAt: z.number().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.get('/api/state', (_req, res) => {
  res.json(getState());
});

app.post('/api/projects', (req, res, next) => {
  try {
    const payload = projectSchema.parse(req.body);
    const project = insertProject(payload);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/projects/:id', (req, res, next) => {
  try {
    const payload = projectUpdateSchema.parse(req.body);
    const project = updateProject(req.params.id, payload);
    if (!project) {
      res.status(404).json({ error: 'Projeto não encontrado' });
      return;
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/projects/:id', (req, res, next) => {
  try {
    deleteProject(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/tasks', (req, res, next) => {
  try {
    const payload = taskSchema.parse(req.body);
    const task = insertTask(payload);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/tasks/:id', (req, res, next) => {
  try {
    const payload = taskUpdateSchema.parse(req.body);
    const task = updateTask(req.params.id, payload);
    if (!task) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/tasks/:id', (req, res, next) => {
  try {
    deleteTask(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/export', (_req, res) => {
  res.json({
    version: 1,
    exportedAt: Date.now(),
    ...getState(),
  });
});

app.post('/api/import', (req, res, next) => {
  try {
    const payload = exportSchema.parse(req.body);
    const state = replaceAll(payload);
    res.json({
      version: 1,
      exportedAt: Date.now(),
      ...state,
    });
  } catch (error) {
    next(error);
  }
});

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Payload inválido', issues: error.issues });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Erro interno' });
});

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`API escutando em http://localhost:${port}`);
});
