import React from 'react';
import { 
  Lock, 
  Plus, 
  ShieldAlert, 
  Sparkles, 
  KeyRound, 
  Settings, 
  LogOut,
  Clock
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface VaultHeaderProps {
  onNewItem: () => void;
  onOpenGenerator: () => void;
  onOpenAudit: () => void;
  onOpen2FA: () => void;
  onOpenSettings: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  onNewItem,
  onOpenGenerator,
  onOpenAudit,
  onOpen2FA,
  onOpenSettings,
  currentView,
  onSelectView,
}) => {
  const { lockVault, getSecurityAudit, autoLockMinutes } = useVault();
  const audit = getSecurityAudit();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0 select-none">
      {/* Zone 1: Brand wordmark in display face */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#" 
          onClick={e => { e.preventDefault(); onSelectView('all'); }} 
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center shadow-sm">
            <Lock size={16} />
          </div>
          <span>Kryptos Vault</span>
        </a>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          onClick={() => onSelectView('all')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'all' ? 'text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Vault Items
        </button>

        <button
          onClick={onOpen2FA}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-400"
        >
          <KeyRound size={13} className="text-cyan-400" />
          <span>2FA Authenticator</span>
        </button>

        <button
          onClick={onOpenGenerator}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-400"
        >
          <Sparkles size={13} className="text-cyan-400" />
          <span>Key Generator</span>
        </button>

        <button
          onClick={onOpenAudit}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-400"
        >
          <ShieldAlert size={13} className={audit.overallScore < 80 ? 'text-amber-400' : 'text-emerald-400'} />
          <span>Security Audit ({audit.overallScore}%)</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-400"
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action + Quick Lock */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={lockVault}
          title="Lock Vault immediately (Ctrl+L)"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={16} />
        </button>

        <button
          type="button"
          onClick={onNewItem}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus size={14} />
          <span>New Password</span>
        </button>
      </div>
    </header>
  );
};
