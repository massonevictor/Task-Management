import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { ProjectColumn } from './ProjectColumn';
import { useAppStore } from '../store/useAppStore';
import type { Project, Task } from '../types';
import { applyTaskFilters } from '../utils/filters';

interface BoardProps {
  onCreateTask: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onEditTask: (task: Task) => void;
}

export function Board({ onCreateTask, onEditProject, onEditTask }: BoardProps) {
  const projects = useAppStore((state) => state.projects);
  const tasks = useAppStore((state) => state.tasks);
  const filters = useAppStore((state) => state.filters);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const reorderProjects = useAppStore((state) => state.reorderProjects);
  const reorderTasks = useAppStore((state) => state.reorderTasks);
  const toggleTask = useAppStore((state) => state.toggleTask);

  const projectTasks = useMemo(
    () =>
      projects.reduce<Record<string, Task[]>>((map, project) => {
        const scoped = tasks
          .filter((task) => task.projectId === project.id)
          .sort((a, b) => a.position - b.position);
        map[project.id] = applyTaskFilters(scoped, filters);
        return map;
      }, {}),
    [filters, projects, tasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        reorderProjects(String(active.id), String(over.id)).catch(console.error);
      }}
    >
      <SortableContext items={projects.map((project) => project.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {projects.map((project) => (
            <ProjectColumn
              key={project.id}
              project={project}
              tasks={projectTasks[project.id] ?? []}
              filterStatus={filters.status}
              onAddTask={onCreateTask}
              onEditProject={onEditProject}
              onDeleteProject={(id) => deleteProject(id).catch(console.error)}
              onEditTask={onEditTask}
              onDeleteTask={(taskId) => deleteTask(taskId).catch(console.error)}
              onToggleTask={(taskId) => toggleTask(taskId).catch(console.error)}
              onReorderTasks={(activeId, overId) => reorderTasks(activeId, overId).catch(console.error)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
