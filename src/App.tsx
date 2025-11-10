import { useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/AppShell';
import { Board } from './components/Board';
import { ProjectModal } from './components/ProjectModal';
import { TaskModal } from './components/TaskModal';
import { EmptyState } from './components/EmptyState';
import { FloatingButton } from './components/FloatingButton';
import { useAppStore } from './store/useAppStore';
import type { Project, Task } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

type ProjectModalState =
  | { mode: 'create'; project?: undefined }
  | { mode: 'edit'; project: Project };

type TaskModalState =
  | { mode: 'create'; projectId?: string }
  | { mode: 'edit'; task: Task };

export default function App() {
  const load = useAppStore((state) => state.load);
  const ready = useAppStore((state) => state.ready);
  const projects = useAppStore((state) => state.projects);
  const addProject = useAppStore((state) => state.addProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const theme = useAppStore((state) => state.theme);

  const [projectModal, setProjectModal] = useState<ProjectModalState | null>(null);
  const [taskModal, setTaskModal] = useState<TaskModalState | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const openProjectModal = (project?: Project) =>
    setProjectModal(project ? { mode: 'edit', project } : { mode: 'create' });

  const openTaskModal = (taskOrProjectId?: Task | string) => {
    if (typeof taskOrProjectId === 'string' || taskOrProjectId == null) {
      setTaskModal({ mode: 'create', projectId: taskOrProjectId });
    } else {
      setTaskModal({ mode: 'edit', task: taskOrProjectId });
    }
  };

  useKeyboardShortcuts({
    focusSearch: () => searchRef.current?.focus(),
    openProjectModal: () => openProjectModal(),
    openTaskModal: (projectId) => openTaskModal(projectId),
  });

  const handleProjectSubmit = async (title: string) => {
    if (projectModal?.mode === 'edit') {
      await updateProject(projectModal.project.id, title);
    } else {
      await addProject(title);
    }
  };

  const handleTaskSubmit = async (payload: { projectId: string; title: string; description?: string; priority: Task['priority'] }) => {
    if (taskModal?.mode === 'edit') {
      await updateTask(taskModal.task.id, {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
      });
    } else {
      await addTask(payload);
    }
  };

  const currentTaskDefaults = useMemo(() => {
    if (taskModal?.mode === 'edit') {
      return taskModal.task;
    }
    if (taskModal?.mode === 'create') {
      const projectId = taskModal.projectId ?? projects[0]?.id;
      return { projectId } as Partial<Task>;
    }
    return undefined;
  }, [projects, taskModal]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Carregando...
      </div>
    );
  }

  return (
    <>
      <AppShell
        searchRef={searchRef}
        onNewProject={() => openProjectModal()}
        onNewTask={() => openTaskModal(projects[0]?.id)}
      >
        {projects.length ? (
          <Board
            onCreateTask={(projectId) => openTaskModal(projectId)}
            onEditProject={(project) => openProjectModal(project)}
            onEditTask={(task) => openTaskModal(task)}
          />
        ) : (
          <EmptyState
            title="Nada por aqui ainda."
            actionLabel="Criar primeiro projeto"
            onAction={() => openProjectModal()}
          />
        )}
      </AppShell>

      <FloatingButton onClick={() => openProjectModal()} label="Novo projeto" />

      <ProjectModal
        open={Boolean(projectModal)}
        defaultValue={projectModal?.mode === 'edit' ? projectModal.project.title : ''}
        onClose={() => setProjectModal(null)}
        onSubmit={handleProjectSubmit}
      />

      <TaskModal
        open={Boolean(taskModal)}
        projects={projects}
        defaultValues={currentTaskDefaults}
        onClose={() => setTaskModal(null)}
        onSubmit={handleTaskSubmit}
      />

      <Toaster position="top-center" />
    </>
  );
}
