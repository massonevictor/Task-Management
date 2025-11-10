import { Plus } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingButton({ onClick, label = 'Novo' }: FloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-accent/30 transition hover:translate-y-[1px] hover:opacity-90"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
