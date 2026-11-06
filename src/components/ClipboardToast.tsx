import React from 'react';
import { useVault } from '../context/VaultContext';
import { Check, ShieldAlert, Trash2 } from 'lucide-react';

export const ClipboardToast: React.FC = () => {
  const { clipboardNotification } = useVault();

  if (!clipboardNotification) return null;

  const handleClearNow = async () => {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      // Permission might be denied
    }
  };

  const progressPercent = (clipboardNotification.secondsLeft / 30) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-1.5 p-3.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 max-w-sm w-full animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={13} />
          </div>
          <div className="text-xs font-medium truncate text-slate-200">
            {clipboardNotification.text}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearNow}
          className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 shrink-0 font-medium cursor-pointer"
        >
          <Trash2 size={11} />
          <span>Clear Now</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span>Clipboard auto-purge</span>
        <span className="text-cyan-400 tabular-nums font-semibold">
          {clipboardNotification.secondsLeft}s left
        </span>
      </div>

      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
        <div
          className="bg-cyan-400 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
        />
      </div>
    </div>
  );
};
