import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

interface KeyboardOptions {
  focusSearch: () => void;
  openProjectModal: () => void;
  openTaskModal: (projectId?: string) => void;
}

export function useKeyboardShortcuts({ focusSearch, openProjectModal, openTaskModal }: KeyboardOptions) {
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const lastUsedProjectId = useAppStore((state) => state.lastUsedProjectId);
  const projects = useAppStore((state) => state.projects);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.getAttribute('contenteditable') === 'true';

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (isTypingTarget) {
        return;
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        openProjectModal();
      } else if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        openTaskModal(lastUsedProjectId ?? projects[0]?.id);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedTaskId) {
          event.preventDefault();
          deleteTask(selectedTaskId).catch(console.error);
        }
      } else if (event.code === 'Space' && selectedTaskId) {
        event.preventDefault();
        toggleTask(selectedTaskId).catch(console.error);
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [deleteTask, focusSearch, lastUsedProjectId, openProjectModal, openTaskModal, projects, selectedTaskId, toggleTask]);
}
