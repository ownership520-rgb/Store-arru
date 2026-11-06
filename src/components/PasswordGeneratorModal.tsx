import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Sliders,
  Dice5
} from 'lucide-react';
import { GeneratorOptions } from '../types';
import { generatePassword, analyzePasswordStrength } from '../crypto/vaultCrypto';
import { useVault } from '../context/VaultContext';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectPassword,
}) => {
  const { copyToClipboard } = useVault();
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 20,
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

  const [generated, setGenerated] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const regenerate = () => {
    const pwd = generatePassword(options);
    setGenerated(pwd);
  };

  useEffect(() => {
    if (isOpen) {
      regenerate();
    }
  }, [isOpen, options]);

  if (!isOpen) return null;

  const strength = analyzePasswordStrength(generated);

  const handleCopy = () => {
    copyToClipboard(generated, 'Generated Password');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUsePassword = () => {
    if (onSelectPassword) {
      onSelectPassword(generated);
    }
    handleCopy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Cryptographic Key Generator</h2>
              <p className="text-xs text-slate-400">Derived via Web Crypto CSPRNG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Display Box */}
        <div className="flex flex-col gap-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-lg text-cyan-200 tracking-wider break-all select-all font-semibold">
              {generated}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={regenerate}
                title="Generate new password"
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={17} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy to clipboard"
                className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check size={17} className="text-emerald-400" /> : <Copy size={17} />}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div
                    key={idx}
                    className={`h-1.5 w-6 rounded-full transition-all ${
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
              <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              {strength.entropy} bits entropy
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setOptions({ ...options, mode: 'password' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              options.mode === 'password'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={13} />
            Random Characters
          </button>
          <button
            type="button"
            onClick={() => setOptions({ ...options, mode: 'passphrase' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              options.mode === 'passphrase'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dice5 size={13} />
            Diceware Passphrase
          </button>
        </div>

        {/* Configuration Controls */}
        {options.mode === 'password' ? (
          <div className="flex flex-col gap-4 text-sm">
            {/* Length slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Password Length</span>
                <span className="font-mono font-bold text-cyan-400 text-sm tabular-nums">
                  {options.length}
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={e => setOptions({ ...options, length: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>8 chars</span>
                <span>20 chars (recommended)</span>
                <span>64 chars</span>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={options.useUpper}
                  onChange={e => setOptions({ ...options, useUpper: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={options.useLower}
                  onChange={e => setOptions({ ...options, useLower: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Lowercase (a-z)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={options.useNumbers}
                  onChange={e => setOptions({ ...options, useNumbers: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={options.useSymbols}
                  onChange={e => setOptions({ ...options, useSymbols: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Symbols (!@#$...)</span>
              </label>
            </div>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
              <input
                type="checkbox"
                checked={options.avoidAmbiguous}
                onChange={e => setOptions({ ...options, avoidAmbiguous: e.target.checked })}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                Avoid ambiguous characters (e.g. 1, l, I, 0, O)
              </span>
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            {/* Word count slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Number of Words</span>
                <span className="font-mono font-bold text-cyan-400 text-sm tabular-nums">
                  {options.wordCount} words
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="7"
                value={options.wordCount}
                onChange={e => setOptions({ ...options, wordCount: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3 words</span>
                <span>4-5 words (strong & memorable)</span>
                <span>7 words</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Word Separator</label>
                <select
                  value={options.separator}
                  onChange={e => setOptions({ ...options, separator: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value=".">Period (.)</option>
                  <option value="_">Underscore (_)</option>
                  <option value=" ">Space ( )</option>
                  <option value="">None (Concatenated)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer w-full hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={options.capitalizeWords}
                    onChange={e => setOptions({ ...options, capitalizeWords: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300">Capitalize words</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {onSelectPassword ? (
            <button
              type="button"
              onClick={handleUsePassword}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check size={14} />
              Insert Password
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Password'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
