import { z } from 'zod';

export const prioritySchema = z.enum(['low', 'medium', 'high']);

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  position: z.number(),
  createdAt: z.number(),
});

export const taskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: prioritySchema,
  done: z.boolean(),
  position: z.number(),
  createdAt: z.number(),
  completedAt: z.number().optional().nullable(),
});

export const exportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  projects: z.array(projectSchema),
  tasks: z.array(taskSchema),
});

export type ExportPayload = z.infer<typeof exportSchema>;
