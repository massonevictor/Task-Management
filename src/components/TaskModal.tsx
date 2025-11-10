import { useEffect, useState, useId } from 'react';
import type { Priority, Project, Task } from '../types';
import { Modal } from './Modal';

interface TaskModalProps {
  open: boolean;
  projects: Project[];
  defaultValues?: Partial<Task>;
  onClose: () => void;
  onSubmit: (payload: {
    projectId: string;
    title: string;
    description?: string;
    priority: Priority;
  }) => Promise<void> | void;
}

const priorities: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

export function TaskModal({
  open,
  projects,
  defaultValues,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const isEditing = Boolean(defaultValues?.id);
  const formId = useId();
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [priority, setPriority] = useState<Priority>(defaultValues?.priority ?? 'medium');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setTitle(defaultValues?.title ?? '');
      setDescription(defaultValues?.description ?? '');
      setPriority(defaultValues?.priority ?? 'medium');
      setProjectId(defaultValues?.projectId ?? projects[0]?.id ?? '');
    }
  }, [defaultValues, open, projects]);

  const handleSubmit = async () => {
    if (!title.trim() || !projectId) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      projectId,
    });
    onClose();
  };

  const projectOptions = projects.length ? (
    isEditing ? (
      <div className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-500 dark:border-slate-700 dark:text-slate-300">
        {projects.find((project) => project.id === projectId)?.title ?? 'Projeto'}
      </div>
    ) : (
      <select
        value={projectId}
        onChange={(event) => setProjectId(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    )
  ) : (
    <p className="text-sm text-slate-500">Crie um projeto antes de adicionar tarefas.</p>
  );

  return (
    <Modal
      open={open}
      title={isEditing ? 'Editar tarefa' : 'Nova tarefa'}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={!title.trim() || !projectId}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-200">
          Projeto
          {projectOptions}
          {isEditing ? (
            <span className="text-xs font-normal text-slate-400">Mover tarefas entre projetos é bloqueado.</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-200">
          Título
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-base font-normal text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Nome da tarefa"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-200">
          Descrição (opcional)
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Detalhes importantes..."
          />
        </label>
        <div className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-200">
          Prioridade
          <div className="flex gap-2">
            {priorities.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`flex-1 rounded-full border px-3 py-2 text-sm ${
                  priority === option.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
