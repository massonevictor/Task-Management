import { useAppStore } from '../store/useAppStore';
import type { Priority } from '../types';

const priorityOptions: Array<{ label: string; value: Priority | 'all' }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Baixa', value: 'low' },
  { label: 'Média', value: 'medium' },
  { label: 'Alta', value: 'high' },
];

const statusOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Ativas', value: 'active' },
  { label: 'Concluídas', value: 'done' },
];

export function FilterBar() {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);

  return (
    <section className="flex flex-wrap gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prioridade</span>
        {priorityOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilters({ priority: option.value })}
            className={`rounded-full px-3 py-1 ${
              filters.priority === option.value
                ? 'bg-accent text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilters({ status: option.value as typeof filters.status })}
            className={`rounded-full px-3 py-1 ${
              filters.status === option.value
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
