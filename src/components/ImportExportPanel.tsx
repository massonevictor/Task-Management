import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export function ImportExportPanel() {
  const exportBackup = useAppStore((state) => state.exportBackup);
  const importBackup = useAppStore((state) => state.importBackup);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);

  const handleExport = async () => {
    setWorking(true);
    try {
      const payload = await exportBackup();
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanban-backup-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao exportar backup');
    } finally {
      setWorking(false);
    }
  };

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setWorking(true);
    try {
      const text = await file.text();
      await importBackup(text);
    } catch (error) {
      console.error(error);
      toast.error('Importação inválida');
    } finally {
      setWorking(false);
      event.target.value = '';
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Backup local</h3>
          <p className="text-xs text-slate-500">Exporte/importe todo o banco SQLite.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={working}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={working}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className="hidden"
      />
    </section>
  );
}
