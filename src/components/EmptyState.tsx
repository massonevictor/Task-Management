import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ title, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
      <Inbox className="mb-4 h-12 w-12 text-slate-400" />
      <p className="mb-4 text-base font-medium text-slate-600 dark:text-slate-200">{title}</p>
      <button
        type="button"
        onClick={onAction}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
      >
        {actionLabel}
      </button>
    </div>
  );
}
