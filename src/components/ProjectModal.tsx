import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface ProjectModalProps {
  open: boolean;
  defaultValue?: string;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void> | void;
}

export function ProjectModal({ open, defaultValue = '', onClose, onSubmit }: ProjectModalProps) {
  const [title, setTitle] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setTitle(defaultValue);
    }
  }, [defaultValue, open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit(title.trim());
    onClose();
  };

  return (
    <Modal
      open={open}
      title={defaultValue ? 'Editar projeto' : 'Novo projeto'}
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
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-200">
        Nome do projeto
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-base font-normal text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Projeto incrível"
        />
      </label>
    </Modal>
  );
}
