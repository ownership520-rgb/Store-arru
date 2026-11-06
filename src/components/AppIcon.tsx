import React from 'react';
import { 
  Globe, 
  Key, 
  FileText, 
  CreditCard, 
  Server, 
  ShieldCheck,
  Code
} from 'lucide-react';
import { ItemCategory } from '../types';

interface AppIconProps {
  title: string;
  category: ItemCategory;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BRAND_PALETTES: Record<string, { bg: string; text: string; label: string }> = {
  github: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-100', label: 'GH' },
  google: { bg: 'bg-blue-950/60 border-blue-800/60', text: 'text-blue-400', label: 'G' },
  aws: { bg: 'bg-amber-950/60 border-amber-800/60', text: 'text-amber-400', label: 'AWS' },
  amazon: { bg: 'bg-amber-950/60 border-amber-800/60', text: 'text-amber-400', label: 'AMZ' },
  netflix: { bg: 'bg-rose-950/60 border-rose-800/60', text: 'text-rose-400', label: 'N' },
  spotify: { bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-400', label: 'SP' },
  stripe: { bg: 'bg-indigo-950/60 border-indigo-800/60', text: 'text-indigo-400', label: 'S' },
  slack: { bg: 'bg-teal-950/60 border-teal-800/60', text: 'text-teal-400', label: 'SL' },
  discord: { bg: 'bg-indigo-950/60 border-indigo-800/60', text: 'text-indigo-400', label: 'DC' },
  apple: { bg: 'bg-slate-800 border-slate-700', text: 'text-slate-200', label: 'APL' },
  microsoft: { bg: 'bg-sky-950/60 border-sky-800/60', text: 'text-sky-400', label: 'MS' },
  notion: { bg: 'bg-neutral-800 border-neutral-700', text: 'text-neutral-200', label: 'N' },
  figma: { bg: 'bg-purple-950/60 border-purple-800/60', text: 'text-purple-400', label: 'FG' },
  twitter: { bg: 'bg-sky-950/60 border-sky-800/60', text: 'text-sky-400', label: 'X' },
  x: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-200', label: 'X' },
  chase: { bg: 'bg-blue-950/60 border-blue-800/60', text: 'text-blue-300', label: 'CH' },
  steam: { bg: 'bg-slate-900 border-slate-700', text: 'text-cyan-400', label: 'ST' },
  reddit: { bg: 'bg-orange-950/60 border-orange-800/60', text: 'text-orange-400', label: 'RD' }
};

export const AppIcon: React.FC<AppIconProps> = ({ title, category, size = 'md' }) => {
  const normalized = title.toLowerCase().trim();
  
  // Check if matches known brand
  const matchedKey = Object.keys(BRAND_PALETTES).find(k => normalized.includes(k));
  const brand = matchedKey ? BRAND_PALETTES[matchedKey] : null;

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-base rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  }[size];

  if (category === 'secure_note') {
    return (
      <div className={`${sizeClasses} bg-amber-950/40 border border-amber-800/50 text-amber-400 flex items-center justify-center shrink-0`}>
        <FileText size={iconSizes} />
      </div>
    );
  }

  if (category === 'credit_card') {
    return (
      <div className={`${sizeClasses} bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0`}>
        <CreditCard size={iconSizes} />
      </div>
    );
  }

  if (category === 'server') {
    return (
      <div className={`${sizeClasses} bg-violet-950/40 border border-violet-800/50 text-violet-400 flex items-center justify-center shrink-0`}>
        <Server size={iconSizes} />
      </div>
    );
  }

  if (category === 'api_key') {
    return (
      <div className={`${sizeClasses} bg-cyan-950/40 border border-cyan-800/50 text-cyan-400 flex items-center justify-center shrink-0`}>
        <Code size={iconSizes} />
      </div>
    );
  }

  if (brand) {
    return (
      <div className={`${sizeClasses} ${brand.bg} border ${brand.text} font-bold flex items-center justify-center shrink-0 tracking-tight font-mono`}>
        {brand.label}
      </div>
    );
  }

  // Fallback monogram
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className={`${sizeClasses} bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center justify-center shrink-0 font-mono`}>
      {initials || <Key size={iconSizes} />}
    </div>
  );
};
