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
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripHorizontal, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type Project, type Task, type StatusFilter } from '../types';
import { TaskCard } from './TaskCard';

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  filterStatus: StatusFilter;
  onAddTask: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onReorderTasks: (activeId: string, overId: string) => void;
}

export function ProjectColumn({
  project,
  tasks,
  filterStatus,
  onAddTask,
  onEditProject,
  onDeleteProject,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  onReorderTasks,
}: ProjectColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: {
      type: 'project',
    },
  });
  const [finishedCollapsed, setFinishedCollapsed] = useState(true);

  useEffect(() => {
    if (filterStatus === 'done') {
      setFinishedCollapsed(false);
    }
  }, [filterStatus]);

  const activeTasks = useMemo(() => tasks.filter((task) => !task.done), [tasks]);
  const finishedTasks = useMemo(() => tasks.filter((task) => task.done), [tasks]);
  const finishedIds = useMemo(() => new Set(finishedTasks.map((task) => task.id)), [finishedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`flex h-full w-[320px] flex-shrink-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 ${
        isDragging ? 'ring-2 ring-accent' : ''
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800"
              aria-label="Reordenar coluna"
            >
              <GripHorizontal className="h-5 w-5" />
            </button>
            {project.title}
          </h2>
          <p className="text-xs text-slate-500">{tasks.length} tarefas</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEditProject(project)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
            aria-label="Editar projeto"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Excluir o projeto "${project.title}"?`)) {
                onDeleteProject(project.id);
              }
            }}
            className="rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-100"
          >
            Excluir
          </button>
        </div>
      </header>

      <button
        type="button"
        onClick={() => onAddTask(project.id)}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-200"
      >
        <Plus className="h-4 w-4" />
        Nova tarefa
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          if (finishedIds.has(String(active.id)) || finishedIds.has(String(over.id))) {
            return;
          }
          onReorderTasks(String(active.id), String(over.id));
        }}
      >
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
          <SortableContext items={activeTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  onToggle={() => onToggleTask(task.id)}
                />
              ))}
              {!activeTasks.length && filterStatus !== 'done' ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
                  Sem tarefas ativas.
                </p>
              ) : null}
            </div>
          </SortableContext>

          {finishedTasks.length > 0 && filterStatus !== 'active' ? (
            <div className="rounded-2xl border border-slate-100/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => setFinishedCollapsed((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                <span>Finished</span>
                <span className="flex items-center gap-2 text-slate-400">
                  {finishedTasks.length}
                  <ChevronDown
                    className={`h-4 w-4 transition ${finishedCollapsed ? '' : 'rotate-180'}`}
                  />
                </span>
              </button>
              {!finishedCollapsed && (
                <div className="mt-3 flex flex-col gap-3">
                  {finishedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      draggable={false}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                      onToggle={() => onToggleTask(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DndContext>
    </section>
  );
}
