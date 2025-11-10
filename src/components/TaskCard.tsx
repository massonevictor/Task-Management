import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, GripVertical, Trash2 } from 'lucide-react';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { Task } from '../types';
import { formatDate } from '../utils/format';
import { useAppStore } from '../store/useAppStore';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  draggable?: boolean;
}

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
};

interface TaskCardBaseProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onSelect: () => void;
  selected: boolean;
  dragHandle?: ReactNode;
  style?: CSSProperties;
  isDragging?: boolean;
}

const TaskCardBase = forwardRef<HTMLDivElement, TaskCardBaseProps>(
  ({ task, onEdit, onDelete, onToggle, onSelect, selected, dragHandle, style, isDragging }, ref) => (
    <article
      ref={ref}
      style={style}
      tabIndex={0}
      onFocus={onSelect}
      onClick={onSelect}
      className={`group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card outline-none transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${
        isDragging ? 'opacity-70 ring-2 ring-accent' : ''
      } ${selected ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <input
            type="checkbox"
            checked={task.done}
            onChange={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            className="size-5 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <span className={task.done ? 'line-through opacity-60' : ''}>{task.title}</span>
        </label>
        {dragHandle}
      </div>
      {task.description ? (
        <p className="text-sm text-slate-600 line-clamp-3 dark:text-slate-300">{task.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className={`rounded-full px-2 py-1 font-medium ${priorityColors[task.priority]}`}>
          {task.priority === 'low' && 'Baixa'}
          {task.priority === 'medium' && 'Média'}
          {task.priority === 'high' && 'Alta'}
        </span>
        <div className="flex gap-4">
          <span>Criada em {formatDate(task.createdAt)}</span>
          {task.completedAt ? <span>Concluída em {formatDate(task.completedAt)}</span> : null}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-200"
          aria-label="Editar tarefa"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:text-slate-200"
          aria-label="Excluir tarefa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  ),
);
TaskCardBase.displayName = 'TaskCardBase';

export function TaskCard({ task, onEdit, onDelete, onToggle, draggable = true }: TaskCardProps) {
  const selection = useAppStore((state) => state.selectedTaskId);
  const setSelection = useAppStore((state) => state.setSelection);

  if (!draggable) {
    return (
      <TaskCardBase
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onSelect={() => setSelection(task.id)}
        selected={selection === task.id}
        dragHandle={
          <span className="rounded-full p-1 text-slate-300" aria-hidden="true">
            <GripVertical className="h-4 w-4" />
          </span>
        }
      />
    );
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      projectId: task.projectId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800"
      aria-label="Reordenar"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <TaskCardBase
      ref={setNodeRef}
      task={task}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggle={onToggle}
      onSelect={() => setSelection(task.id)}
      selected={selection === task.id}
      dragHandle={dragHandle}
      style={style}
      isDragging={isDragging}
    />
  );
}
