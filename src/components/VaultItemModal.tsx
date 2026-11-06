import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  ExternalLink,
  History,
  Lock,
  Globe,
  KeyRound,
  FileText,
  Star,
  RefreshCw
} from 'lucide-react';
import { VaultItem, ItemCategory, CustomField } from '../types';
import { useVault } from '../context/VaultContext';
import { 
  analyzePasswordStrength, 
  generatePassword 
} from '../crypto/vaultCrypto';
import { TOTPDisplay } from './TOTPDisplay';

interface VaultItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: VaultItem | null;
  defaultCategory?: ItemCategory;
}

export const VaultItemModal: React.FC<VaultItemModalProps> = ({
  isOpen,
  onClose,
  initialItem,
  defaultCategory = 'login',
}) => {
  const { addItem, updateItem, copyToClipboard } = useVault();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>(defaultCategory);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [folder, setFolder] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInlineGen, setShowInlineGen] = useState(false);
  const [genLength, setGenLength] = useState(20);
  const [copiedHistoryIndex, setCopiedHistoryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || '');
      setCategory(initialItem.category || 'login');
      setUsername(initialItem.username || '');
      setPassword(initialItem.password || '');
      setUrl(initialItem.url || '');
      setNotes(initialItem.notes || '');
      setTotpSecret(initialItem.totpSecret || '');
      setFolder(initialItem.folder || '');
      setTagsInput(initialItem.tags ? initialItem.tags.join(', ') : '');
      setFavorite(initialItem.favorite || false);
      setCustomFields(initialItem.customFields || []);
      setShowPassword(false);
      setShowHistory(false);
      setShowInlineGen(false);
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
      setTotpSecret('');
      setFolder('');
      setTagsInput('');
      setFavorite(false);
      setCustomFields([]);
      setShowPassword(false);
      setShowHistory(false);
      setShowInlineGen(false);
    }
  }, [initialItem, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const strength = analyzePasswordStrength(password);

  const handleGenerateInline = () => {
    const newPass = generatePassword({
      length: genLength,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSymbols: true,
      avoidAmbiguous: true,
      mode: 'password',
      wordCount: 4,
      separator: '-',
      capitalizeWords: true,
    });
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: 'cf_' + Date.now(),
        label: 'Field ' + (customFields.length + 1),
        value: '',
        isSecret: false,
      },
    ]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const payload = {
      title: title.trim(),
      category,
      username: username.trim(),
      password,
      url: url.trim(),
      notes: notes.trim(),
      totpSecret: totpSecret.trim(),
      folder: folder.trim(),
      tags,
      favorite,
      customFields,
    };

    if (initialItem) {
      await updateItem({
        ...initialItem,
        ...payload,
      });
    } else {
      await addItem(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              title={favorite ? 'Starred item' : 'Mark as favorite'}
              className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Star
                size={18}
                className={favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}
              />
            </button>
            <h2 className="text-base font-semibold text-white">
              {initialItem ? 'Edit Vault Item' : 'New Encrypted Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              {(
                [
                  { id: 'login', label: 'Login' },
                  { id: 'secure_note', label: 'Note' },
                  { id: 'credit_card', label: 'Card' },
                  { id: 'api_key', label: 'API Key' },
                  { id: 'server', label: 'Server' },
                ] as const
              ).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    category === cat.id
                      ? 'bg-slate-800 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              App / Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GitHub, Google, AWS, Netflix, Spotify"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Username / Email */}
          {category !== 'secure_note' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Username / Email / Account ID
              </label>
              <input
                type="text"
                placeholder="e.g. user@example.com or admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          )}

          {/* Password Field */}
          {category !== 'secure_note' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Password / Secret Key</span>
                <div className="flex items-center gap-2">
                  {initialItem?.passwordHistory && initialItem.passwordHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                    >
                      <History size={12} />
                      <span>History ({initialItem.passwordHistory.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineGen(!showInlineGen);
                      if (!showInlineGen && !password) {
                        handleGenerateInline();
                      }
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles size={12} />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter or generate secret"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-20 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {password && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(password, 'Password')}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg cursor-pointer"
                      title="Copy password"
                    >
                      <Copy size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`h-1 w-5 rounded-full ${
                            idx <= strength.score
                              ? strength.score === 4
                                ? 'bg-cyan-400'
                                : strength.score === 3
                                ? 'bg-emerald-400'
                                : strength.score === 2
                                ? 'bg-yellow-400'
                                : 'bg-rose-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`font-medium ${strength.color}`}>{strength.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {strength.entropy} bits
                  </span>
                </div>
              )}

              {/* Inline Generator Controls Drawer */}
              {showInlineGen && (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Generated Length: {genLength}</span>
                    <button
                      type="button"
                      onClick={handleGenerateInline}
                      className="px-2 py-1 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950 border border-cyan-800 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} />
                      <span>Re-roll</span>
                    </button>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={genLength}
                    onChange={e => {
                      setGenLength(Number(e.target.value));
                    }}
                    onMouseUp={handleGenerateInline}
                    onTouchEnd={handleGenerateInline}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              {/* Password History Drawer */}
              {showHistory && initialItem?.passwordHistory && (
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Previous Passwords</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {initialItem.passwordHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                        <span className="font-mono text-slate-400 truncate max-w-[240px]">
                          {h.password}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.changedAt).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(h.password, 'Historical Password');
                              setCopiedHistoryIndex(i);
                              setTimeout(() => setCopiedHistoryIndex(null), 2000);
                            }}
                            className="p-1 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                          >
                            {copiedHistoryIndex === i ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Website / App URL */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Website URL</label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://example.com/login"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {url && (
                <a
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                  title="Open in new window"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>

          {/* 2FA / TOTP Secret Key */}
          {category === 'login' && (
            <div className="space-y-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <KeyRound size={13} className="text-cyan-400" />
                  Two-Factor Authentication Secret (TOTP)
                </span>
                <span className="text-[11px] text-slate-400">Base32 string</span>
              </div>
              <input
                type="text"
                placeholder="e.g. JBSWY3DPEHPK3PXP"
                value={totpSecret}
                onChange={e => setTotpSecret(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono tracking-wider uppercase"
              />
              {totpSecret.trim().length >= 8 && (
                <div className="pt-1">
                  <TOTPDisplay secret={totpSecret} appTitle={title || 'New Item'} />
                </div>
              )}
            </div>
          )}

          {/* Custom Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Custom Fields</span>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus size={12} />
                <span>Add Field</span>
              </button>
            </div>

            {customFields.map(field => (
              <div key={field.id} className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                <input
                  type="text"
                  placeholder="Label (e.g. PIN, Recovery Phrase)"
                  value={field.label}
                  onChange={e => handleUpdateCustomField(field.id, { label: e.target.value })}
                  className="w-1/3 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type={field.isSecret ? 'password' : 'text'}
                  placeholder="Value"
                  value={field.value}
                  onChange={e => handleUpdateCustomField(field.id, { value: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateCustomField(field.id, { isSecret: !field.isSecret })}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                  title={field.isSecret ? 'Secret field' : 'Plaintext field'}
                >
                  {field.isSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(field.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                  title="Remove field"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Secure Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Encrypted Notes</label>
            <textarea
              rows={3}
              placeholder="Additional secure notes, recovery codes, security questions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />
          </div>

          {/* Organization: Folder & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Folder</label>
              <input
                type="text"
                placeholder="e.g. Work, Personal, Finance"
                value={folder}
                onChange={e => setFolder(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="cloud, git, 2fa, sso"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock size={13} className="text-cyan-400" />
            <span>Encrypted with AES-256-GCM on save</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {initialItem ? 'Save Changes' : 'Encrypt & Store'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
