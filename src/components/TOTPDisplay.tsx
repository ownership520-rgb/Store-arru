import React, { useState, useEffect } from 'react';
import { generateTOTP } from '../crypto/vaultCrypto';
import { Copy, Check, Clock } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface TOTPDisplayProps {
  secret: string;
  appTitle?: string;
  compact?: boolean;
}

export const TOTPDisplay: React.FC<TOTPDisplayProps> = ({ secret, appTitle = '2FA Code', compact = false }) => {
  const { copyToClipboard } = useVault();
  const [code, setCode] = useState<string>('------');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const updateCode = async () => {
      if (!secret) return;
      const res = await generateTOTP(secret);
      if (isMounted) {
        setCode(res.code);
        setSecondsRemaining(res.secondsRemaining);
      }
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [secret]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(code, `${appTitle} 2FA Code`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Circular progress math (radius 10, circumference ~ 62.83)
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsRemaining / 30) * circumference;
  const isExpiringSoon = secondsRemaining <= 5;

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        title="Click to copy 2FA OTP code"
        className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono transition-colors group cursor-pointer"
      >
        <span className="text-cyan-400 font-semibold tracking-wider tabular-nums">{code}</span>
        <div className="relative w-4 h-4 flex items-center justify-center">
          <svg className="w-4 h-4 transform -rotate-90">
            <circle
              cx="8"
              cy="8"
              r={radius - 2}
              className="stroke-slate-800"
              strokeWidth="2"
              fill="transparent"
            />
            <circle
              cx="8"
              cy="8"
              r={radius - 2}
              className={isExpiringSoon ? 'stroke-rose-400 transition-all duration-300' : 'stroke-cyan-400 transition-all duration-300'}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * (radius - 2)}
              strokeDashoffset={(2 * Math.PI * (radius - 2)) - (secondsRemaining / 30) * (2 * Math.PI * (radius - 2))}
              fill="transparent"
            />
          </svg>
          <span className="sr-only">{secondsRemaining}s</span>
        </div>
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500 group-hover:text-slate-300" />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 flex items-center justify-center">
          <svg className="w-9 h-9 transform -rotate-90">
            <circle
              cx="18"
              cy="18"
              r={14}
              className="stroke-slate-800"
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              cx="18"
              cy="18"
              r={14}
              className={isExpiringSoon ? 'stroke-rose-400 transition-all duration-300' : 'stroke-cyan-400 transition-all duration-300'}
              strokeWidth="2.5"
              strokeDasharray={2 * Math.PI * 14}
              strokeDashoffset={(2 * Math.PI * 14) - (secondsRemaining / 30) * (2 * Math.PI * 14)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className={`absolute text-[11px] font-mono tabular-nums ${isExpiringSoon ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {secondsRemaining}s
          </span>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Time-Based One-Time Password (TOTP)</div>
          <div className="text-xl font-bold font-mono tracking-widest text-cyan-300 tabular-nums">
            {code.slice(0, 3)} {code.slice(3)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-cyan-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            <span>Copy Code</span>
          </>
        )}
      </button>
    </div>
  );
};
