import React from 'react';
import { 
  Key, 
  FileText, 
  CreditCard, 
  Code, 
  Server, 
  Star, 
  Trash2, 
  Folder, 
  Tag, 
  ShieldCheck, 
  ShieldAlert,
  Lock,
  Sparkles,
  KeyRound,
  Sliders
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { ItemCategory } from '../types';

interface VaultSidebarProps {
  currentCategory: string;
  onSelectCategory: (category: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  onOpenAudit: () => void;
  onOpenGenerator: () => void;
  onOpen2FA: () => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  currentCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  selectedFolder,
  onSelectFolder,
  onOpenAudit,
  onOpenGenerator,
  onOpen2FA,
}) => {
  const { items, getSecurityAudit } = useVault();
  const audit = getSecurityAudit();

  const activeItems = items.filter(i => !i.trashed);
  const trashedCount = items.filter(i => i.trashed).length;
  const favoriteCount = activeItems.filter(i => i.favorite).length;

  const countForCategory = (cat: ItemCategory) => {
    return activeItems.filter(i => i.category === cat).length;
  };

  // Collect distinct folders and tags
  const folders = Array.from(new Set(activeItems.map(i => i.folder).filter(Boolean))) as string[];
  const allTags = Array.from(
    new Set(activeItems.flatMap(i => i.tags || []).filter(Boolean))
  ) as string[];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 overflow-y-auto select-none">
      <div className="space-y-6">
        {/* Main Vault Views */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 font-mono">
            Vault Items
          </div>

          <button
            onClick={() => {
              onSelectCategory('all');
              onSelectTag(null);
              onSelectFolder(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentCategory === 'all' && !selectedTag && !selectedFolder
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Key size={15} />
              <span>All Items</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {activeItems.length}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectCategory('favorites');
              onSelectTag(null);
              onSelectFolder(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentCategory === 'favorites'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star size={15} className="text-amber-400 fill-amber-400/20" />
              <span>Favorites</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {favoriteCount}
            </span>
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 font-mono">
            Categories
          </div>

          {[
            { id: 'login', label: 'App Logins', icon: Key },
            { id: 'secure_note', label: 'Secure Notes', icon: FileText },
            { id: 'credit_card', label: 'Payment Cards', icon: CreditCard },
            { id: 'api_key', label: 'API Keys', icon: Code },
            { id: 'server', label: 'Servers & SSH', icon: Server },
          ].map(cat => {
            const Icon = cat.icon;
            const count = countForCategory(cat.id as ItemCategory);
            const isSelected = currentCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectTag(null);
                  onSelectFolder(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} />
                  <span>{cat.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Folders (if any) */}
        {folders.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 font-mono">
              Folders
            </div>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => {
                  onSelectFolder(selectedFolder === folder ? null : folder);
                  onSelectCategory('all');
                  onSelectTag(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedFolder === folder
                    ? 'bg-slate-800 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder size={13} className="text-slate-500 shrink-0" />
                  <span className="truncate">{folder}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                  {activeItems.filter(i => i.folder === folder).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tags (if any) */}
        {allTags.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 font-mono">
              Tags
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    onSelectTag(selectedTag === tag ? null : tag);
                    onSelectCategory('all');
                    onSelectFolder(null);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trash */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => {
              onSelectCategory('trash');
              onSelectTag(null);
              onSelectFolder(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentCategory === 'trash'
                ? 'bg-slate-800 text-rose-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={15} />
              <span>Trash Bin</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {trashedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Security Card */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onOpenAudit}
          className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
              <ShieldAlert
                size={14}
                className={audit.overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}
              />
              <span>Security Score</span>
            </div>
            <span
              className={`text-xs font-bold font-mono tabular-nums ${
                audit.overallScore >= 80
                  ? 'text-emerald-400'
                  : audit.overallScore >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {audit.overallScore}%
            </span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                audit.overallScore >= 80
                  ? 'bg-emerald-400'
                  : audit.overallScore >= 50
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
              style={{ width: `${audit.overallScore}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500">
            {audit.reusedCount > 0
              ? `${audit.reusedCount} reused credentials`
              : audit.weakCount > 0
              ? `${audit.weakCount} weak passwords`
              : 'Vault health optimal'}
          </div>
        </button>

        {/* Cryptographic Spec Indicator */}
        <div className="px-2 py-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Lock size={10} className="text-cyan-500" />
            AES-256-GCM
          </span>
          <span>Zero-Knowledge</span>
        </div>
      </div>
    </aside>
  );
};
