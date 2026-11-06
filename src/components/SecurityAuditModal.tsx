import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowRight, 
  Lock, 
  ShieldAlert,
  KeyRound,
  History,
  QrCode
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { VaultItem } from '../types';
import { AppIcon } from './AppIcon';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditItem: (item: VaultItem) => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  onEditItem,
}) => {
  const { getSecurityAudit } = useVault();
  const [activeTab, setActiveTab] = useState<'reused' | 'weak' | 'missing2fa' | 'old'>('reused');

  if (!isOpen) return null;

  const audit = getSecurityAudit();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              audit.overallScore >= 80 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : audit.overallScore >= 50
                ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                : 'bg-rose-950/60 border-rose-800 text-rose-400'
            }`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Vault Security & Health Audit</h2>
              <p className="text-xs text-slate-400">Zero-Knowledge client-side risk assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Score Overview Banner */}
        <div className="grid grid-cols-4 gap-3 p-5 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-400 mb-1">Health Score</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono tabular-nums ${
                audit.overallScore >= 80 ? 'text-emerald-400' : audit.overallScore >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {audit.overallScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('reused')}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'reused'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="text-[11px] text-slate-400 mb-1">Reused Passwords</div>
            <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
              {audit.reusedCount}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weak')}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'weak'
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="text-[11px] text-slate-400 mb-1">Weak Passwords</div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {audit.weakCount}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missing2fa')}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'missing2fa'
                ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="text-[11px] text-slate-400 mb-1">Without 2FA</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {audit.no2faCount}
            </div>
          </button>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'reused' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Reused passwords create catastrophic vulnerability: if one service suffers a breach,
                  attackers easily compromise all linked accounts.
                </span>
              </div>

              {audit.reusedGroups.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl">
                  <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2" />
                  <div className="text-sm font-medium text-slate-200">No Reused Passwords Found</div>
                  <div className="text-xs text-slate-400 mt-1">Every account in your vault uses a unique secret.</div>
                </div>
              ) : (
                audit.reusedGroups.map((group, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold text-rose-300">
                          Identical Password Shared Across {group.items.length} Accounts
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        ••••••••••••
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {group.items.map(item => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <AppIcon title={item.title} category={item.category} size="sm" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
                              <div className="text-xs text-slate-400 truncate">{item.username}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditItem(item);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>Fix Password</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'weak' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Weak passwords can be cracked in seconds via automated dictionary and brute-force attacks.
              </div>

              {audit.weakItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl">
                  <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2" />
                  <div className="text-sm font-medium text-slate-200">All Passwords Strong</div>
                  <div className="text-xs text-slate-400 mt-1">Zero low-entropy credentials detected.</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                  {audit.weakItems.map(item => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <AppIcon title={item.title} category={item.category} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
                          <div className="text-xs text-slate-400 truncate">{item.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-rose-400 font-medium">Low Entropy</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditItem(item);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Upgrade</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'missing2fa' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Two-Factor Authentication (TOTP) adds an unforgeable physical second factor to safeguard against stolen passwords.
              </div>

              {audit.missing2faItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl">
                  <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2" />
                  <div className="text-sm font-medium text-slate-200">All Logins Protected with 2FA</div>
                  <div className="text-xs text-slate-400 mt-1">Full multi-factor coverage active.</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                  {audit.missing2faItems.map(item => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <AppIcon title={item.title} category={item.category} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
                          <div className="text-xs text-slate-400 truncate">{item.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400">No TOTP Key</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditItem(item);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode size={13} />
                          <span>Add 2FA</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Security evaluations occur strictly in local client memory.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
