import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, Search, Plus } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { TOTPDisplay } from './TOTPDisplay';
import { AppIcon } from './AppIcon';
import { VaultItem } from '../types';

interface TOTPAuthenticatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNewWith2FA: () => void;
}

export const TOTPAuthenticatorModal: React.FC<TOTPAuthenticatorModalProps> = ({
  isOpen,
  onClose,
  onAddNewWith2FA,
}) => {
  const { items } = useVault();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const itemsWith2FA = items.filter(
    i => !i.trashed && i.totpSecret && i.totpSecret.trim().length > 0
  );

  const filtered = itemsWith2FA.filter(
    i =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">2FA Authenticator Hub</h2>
              <p className="text-xs text-slate-400">RFC 6238 Time-Based One-Time Passwords</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search 2FA accounts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onAddNewWith2FA();
            }}
            className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Add 2FA Key</span>
          </button>
        </div>

        {/* Tokens List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <ShieldCheck size={32} className="mx-auto text-slate-600 mb-1" />
              <div className="text-sm font-medium text-slate-300">
                {itemsWith2FA.length === 0 ? 'No 2FA Accounts Configured' : 'No Matching Accounts'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add TOTP secret keys (base32 string) when saving or editing app logins to generate live 6-digit verification codes.
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AppIcon title={item.title} category={item.category} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">{item.title}</div>
                      <div className="text-xs text-slate-400 truncate">{item.username}</div>
                    </div>
                  </div>
                </div>

                {item.totpSecret && (
                  <TOTPDisplay secret={item.totpSecret} appTitle={item.title} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Synced locally with your encrypted vault items</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
