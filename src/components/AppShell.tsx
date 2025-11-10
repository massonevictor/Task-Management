import type { ReactNode, RefObject } from 'react';
import { Command } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ThemeToggle } from './ThemeToggle';
import { FilterBar } from './FilterBar';
import { ImportExportPanel } from './ImportExportPanel';

interface AppShellProps {
  children: ReactNode;
  searchRef: RefObject<HTMLInputElement | null>;
  onNewProject: () => void;
  onNewTask: () => void;
}

export function AppShell({ children, searchRef, onNewProject, onNewTask }: AppShellProps) {
  const query = useAppStore((state) => state.filters.query);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] px-4 py-6 text-slate-900 dark:text-slate-100 md:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Projetos locais</h1>
            <p className="text-sm text-slate-500">Tudo offline, sempre sincronizado no seu navegador.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onNewProject}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-200"
            >
              Novo projeto (P)
            </button>
            <button
              type="button"
              onClick={onNewTask}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Nova tarefa (T)
            </button>
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-inner dark:border-slate-800 dark:bg-slate-900/60">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por título ou descrição…"
            aria-label="Buscar tarefas"
            className="flex-1 border-none bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Command className="h-3 w-3" />K
          </span>
        </div>
        <FilterBar />
      </header>
      <main className="flex flex-1 flex-col gap-6">{children}</main>
      <ImportExportPanel />
    </div>
  );
}
