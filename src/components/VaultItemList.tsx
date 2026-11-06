import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Star, 
  Trash2, 
  RotateCcw, 
  Edit3, 
  Plus, 
  Key, 
  Lock, 
  ShieldCheck, 
  ShieldAlert,
  ArrowUpDown,
  SlidersHorizontal,
  Calendar,
  KeyRound,
  FileText
} from 'lucide-react';
import { VaultItem } from '../types';
import { useVault } from '../context/VaultContext';
import { AppIcon } from './AppIcon';
import { TOTPDisplay } from './TOTPDisplay';
import { analyzePasswordStrength } from '../crypto/vaultCrypto';

interface VaultItemListProps {
  category: string;
  selectedTag: string | null;
  selectedFolder: string | null;
  onEditItem: (item: VaultItem) => void;
  onNewItem: () => void;
}

export const VaultItemList: React.FC<VaultItemListProps> = ({
  category,
  selectedTag,
  selectedFolder,
  onEditItem,
  onNewItem,
}) => {
  const { 
    items, 
    toggleFavorite, 
    deleteItem, 
    restoreItem, 
    copyToClipboard 
  } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedIdField, setCopiedIdField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'strength'>('updated');

  // Filter items
  const isTrashView = category === 'trash';
  const filtered = items.filter(item => {
    // Trashed condition
    if (isTrashView) {
      if (!item.trashed) return false;
    } else {
      if (item.trashed) return false;
    }

    // Category / Favorites
    if (category === 'favorites' && !item.favorite) return false;
    if (category !== 'all' && category !== 'favorites' && category !== 'trash') {
      if (item.category !== category) return false;
    }

    // Tag filter
    if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) return false;

    // Folder filter
    if (selectedFolder && item.folder !== selectedFolder) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      const matchTags = item.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchUser && !matchUrl && !matchTags) return false;
    }

    return true;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'strength') {
      const sA = analyzePasswordStrength(a.password || '').score;
      const sB = analyzePasswordStrength(b.password || '').score;
      return sA - sB;
    }
    return b.updatedAt - a.updatedAt;
  });

  // Keep first item selected if none selected or if selection no longer visible
  const activeSelected = sorted.find(i => i.id === selectedItemId) || sorted[0] || null;

  const handleCopy = (text: string, label: string, uniqueKey: string) => {
    copyToClipboard(text, label);
    setCopiedIdField(uniqueKey);
    setTimeout(() => setCopiedIdField(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Middle Column: Items list & filter bar */}
      <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-slate-800 flex flex-col bg-slate-950/40 shrink-0">
        {/* Search & Sort Controls */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5 shrink-0 bg-slate-900/60">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search apps, usernames, URLs, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] tabular-nums font-semibold text-slate-300">
                {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
              </span>
              {selectedTag && <span className="text-cyan-400">· #{selectedTag}</span>}
              {selectedFolder && <span className="text-cyan-400">· {selectedFolder}</span>}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="updated" className="bg-slate-900">Recently Updated</option>
                <option value="title" className="bg-slate-900">Name (A-Z)</option>
                <option value="strength" className="bg-slate-900">Weakest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {sorted.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Key size={18} />
              </div>
              <div className="text-sm font-medium text-slate-300">No passwords found</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {searchQuery
                  ? 'No entries match your search query.'
                  : 'Get started by creating your first encrypted password entry.'}
              </p>
              {!isTrashView && (
                <button
                  type="button"
                  onClick={onNewItem}
                  className="px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Plus size={13} />
                  <span>Add First Password</span>
                </button>
              )}
            </div>
          ) : (
            sorted.map(item => {
              const isSelected = activeSelected?.id === item.id;
              const strength = analyzePasswordStrength(item.password || '');
              const isWeak = item.category === 'login' && item.password && strength.score < 3;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-900/90 border-l-2 border-cyan-400'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AppIcon title={item.title} category={item.category} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {item.title}
                        </span>
                        {item.favorite && (
                          <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
                        )}
                        {item.totpSecret && (
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold shrink-0">
                            2FA
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                        {item.username || (item.notes ? item.notes.slice(0, 30) : 'No username')}
                      </div>

                      {/* Unboxed Metadata: no pills per constitution */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                        <span className="capitalize">{item.category.replace('_', ' ')}</span>
                        {isWeak && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-rose-400 font-medium">Weak Password</span>
                          </>
                        )}
                        {item.folder && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.folder}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Buttons on Row */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.username && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleCopy(item.username, 'Username', `u_${item.id}`);
                        }}
                        title="Copy Username"
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedIdField === `u_${item.id}` ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}

                    {item.password && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleCopy(item.password!, 'Password', `p_${item.id}`);
                        }}
                        title="Copy Password"
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedIdField === `p_${item.id}` ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Lock size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Item Viewer */}
      <div className="hidden lg:flex flex-1 flex-col bg-slate-900/40 overflow-y-auto">
        {activeSelected ? (
          <div className="p-8 max-w-2xl w-full mx-auto space-y-6">
            {/* Header Lockup */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <AppIcon
                  title={activeSelected.title}
                  category={activeSelected.category}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {activeSelected.title}
                    </h1>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(activeSelected.id)}
                      className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        size={18}
                        className={
                          activeSelected.favorite
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-500'
                        }
                      />
                    </button>
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="capitalize">{activeSelected.category.replace('_', ' ')}</span>
                    <span aria-hidden="true">·</span>
                    <span>Updated {new Date(activeSelected.updatedAt).toLocaleDateString()}</span>
                    {activeSelected.folder && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activeSelected.folder}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!isTrashView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditItem(activeSelected)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(activeSelected.id, false)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Move to Trash"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => restoreItem(activeSelected.id)}
                      className="px-3.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Restore</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(activeSelected.id, true)}
                      className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Forever</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Credential Fields Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              {/* Username Field */}
              {activeSelected.username && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Username / Email</div>
                    <div className="text-sm font-mono text-slate-100 select-all mt-0.5">
                      {activeSelected.username}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(activeSelected.username, 'Username', `d_u_${activeSelected.id}`)
                    }
                    className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                    title="Copy Username"
                  >
                    {copiedIdField === `d_u_${activeSelected.id}` ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              )}

              {/* Password Field */}
              {activeSelected.password && (
                <div className="space-y-2 pb-3 border-b border-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Password</div>
                      <div className="text-sm font-mono text-cyan-200 select-all mt-0.5 tracking-wider">
                        {showPasswordMap[activeSelected.id]
                          ? activeSelected.password
                          : '••••••••••••••••'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(activeSelected.id)}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        title={showPasswordMap[activeSelected.id] ? 'Hide' : 'Reveal'}
                      >
                        {showPasswordMap[activeSelected.id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            activeSelected.password!,
                            'Password',
                            `d_p_${activeSelected.id}`
                          )
                        }
                        className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedIdField === `d_p_${activeSelected.id}` ? (
                          <Check size={16} className="text-emerald-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Strength Bar */}
                  {(() => {
                    const st = analyzePasswordStrength(activeSelected.password);
                    return (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(idx => (
                              <div
                                key={idx}
                                className={`h-1 w-6 rounded-full ${
                                  idx <= st.score
                                    ? st.score === 4
                                      ? 'bg-cyan-400'
                                      : st.score === 3
                                      ? 'bg-emerald-400'
                                      : st.score === 2
                                      ? 'bg-yellow-400'
                                      : 'bg-rose-400'
                                    : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`font-semibold ${st.color}`}>{st.label}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {st.entropy} bits entropy
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* URL */}
              {activeSelected.url && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 font-medium">Website URL</div>
                    <a
                      href={
                        activeSelected.url.startsWith('http')
                          ? activeSelected.url
                          : `https://${activeSelected.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:underline truncate block mt-0.5"
                    >
                      {activeSelected.url}
                    </a>
                  </div>
                  <a
                    href={
                      activeSelected.url.startsWith('http')
                        ? activeSelected.url
                        : `https://${activeSelected.url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}

              {/* TOTP 2FA Authenticator Section */}
              {activeSelected.totpSecret && (
                <div className="pt-2">
                  <TOTPDisplay
                    secret={activeSelected.totpSecret}
                    appTitle={activeSelected.title}
                  />
                </div>
              )}
            </div>

            {/* Custom Fields */}
            {activeSelected.customFields && activeSelected.customFields.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-300">Custom Attributes</div>
                <div className="divide-y divide-slate-900">
                  {activeSelected.customFields.map(f => (
                    <div key={f.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500">{f.label}</div>
                        <div className="text-xs font-mono text-slate-200 mt-0.5">
                          {f.isSecret && !showPasswordMap[f.id] ? '••••••••••••' : f.value}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {f.isSecret && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(f.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                          >
                            {showPasswordMap[f.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(f.value, f.label, `cf_${f.id}`)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg cursor-pointer"
                        >
                          {copiedIdField === `cf_${f.id}` ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {activeSelected.notes && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Encrypted Notes</div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {activeSelected.notes}
                </pre>
              </div>
            )}

            {/* Tags */}
            {activeSelected.tags && activeSelected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeSelected.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Lock size={32} className="mb-2 text-slate-700" />
            <div className="text-sm">Select an item from the list to view secure details</div>
          </div>
        )}
      </div>
    </div>
  );
};
