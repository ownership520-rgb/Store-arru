import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  KeyRound,
  FileCheck2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { analyzePasswordStrength } from '../crypto/vaultCrypto';

export const VaultUnlock: React.FC = () => {
  const { 
    isInitialized, 
    initializeVault, 
    unlockVault, 
    unlockWithPin, 
    quickPinEnabled,
    wipeVault 
  } = useVault();

  // Setup state
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [showSetupPwd, setShowSetupPwd] = useState(false);
  const [loadSampleData, setLoadSampleData] = useState(true);
  const [setupPin, setSetupPin] = useState('');
  const [enablePinSetup, setEnablePinSetup] = useState(false);
  const [emergencyKey, setEmergencyKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [setupStep, setSetupStep] = useState<'create' | 'emergency'>('create');
  const [setupError, setSetupError] = useState('');

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [usePinMode, setUsePinMode] = useState(false);
  const [showUnlockPwd, setShowUnlockPwd] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pwdStrength = analyzePasswordStrength(setupPassword);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (setupPassword.length < 8) {
      setSetupError('Master password must be at least 8 characters.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError('Passwords do not match.');
      return;
    }

    try {
      setIsDecrypting(true);
      const res = await initializeVault(
        setupPassword,
        loadSampleData,
        enablePinSetup ? setupPin : undefined
      );
      setEmergencyKey(res.emergencyKey);
      setSetupStep('emergency');
    } catch (err) {
      setSetupError('Failed to initialize cryptographic vault.');
      console.error(err);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setIsDecrypting(true);

    try {
      if (usePinMode && quickPinEnabled) {
        const success = await unlockWithPin(unlockPin);
        if (success) {
          setIsDecrypting(false);
          return;
        } else {
          setUnlockError('Invalid PIN code.');
          setIsDecrypting(false);
          return;
        }
      }

      const success = await unlockVault(unlockPassword);
      if (!success) {
        setUnlockError('Incorrect master password. Decryption failed.');
      }
    } catch {
      setUnlockError('An error occurred during key derivation.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopyKey = () => {
    if (!emergencyKey) return;
    navigator.clipboard.writeText(emergencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDownloadEmergencyKit = () => {
    if (!emergencyKey) return;
    const content = `=====================================================
KRYPTOS ZERO-KNOWLEDGE ENCRYPTED VAULT EMERGENCY KIT
=====================================================

Emergency Recovery Key:
${emergencyKey}

Created At: ${new Date().toUTCString()}

IMPORTANT SECURITY ADVICE:
- Store this sheet offline in a safe physical location.
- Anyone with this key and your encrypted backup can decrypt your vault.
- Never email or share this recovery code in plaintext.
=====================================================`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kryptos-emergency-recovery-kit-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* App Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-950/50 mb-2">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Kryptos Vault
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Zero-Knowledge End-to-End Encrypted Password Vault
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
          {!isInitialized ? (
            /* Setup Flow */
            setupStep === 'create' ? (
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Initialize Your Secure Vault
                  </h2>
                  <p className="text-xs text-slate-400">
                    Choose a strong master password. All items are encrypted locally with AES-256-GCM. We never see or store your password.
                  </p>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-300">Master Password</label>
                  <div className="relative">
                    <input
                      type={showSetupPwd ? 'text' : 'password'}
                      required
                      placeholder="Minimum 8 characters"
                      value={setupPassword}
                      onChange={e => setSetupPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPwd(!showSetupPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showSetupPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {setupPassword && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map(idx => (
                            <div
                              key={idx}
                              className={`h-1 w-5 rounded-full ${
                                idx <= pwdStrength.score
                                  ? pwdStrength.score === 4
                                    ? 'bg-cyan-400'
                                    : pwdStrength.score === 3
                                    ? 'bg-emerald-400'
                                    : pwdStrength.score === 2
                                    ? 'bg-yellow-400'
                                    : 'bg-rose-400'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`font-semibold ${pwdStrength.color}`}>
                          {pwdStrength.label}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {pwdStrength.entropy} bits
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-300">Confirm Master Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter master password"
                    value={setupConfirm}
                    onChange={e => setSetupConfirm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Optional Quick PIN */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={enablePinSetup}
                      onChange={e => setEnablePinSetup(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Configure 4-digit quick PIN for session re-unlock</span>
                  </label>

                  {enablePinSetup && (
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Enter 4-6 digit PIN"
                      value={setupPin}
                      onChange={e => setSetupPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono tracking-widest"
                    />
                  )}
                </div>

                {/* Pre-fill Sample App Data */}
                <label className="flex items-start gap-2.5 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={loadSampleData}
                    onChange={e => setLoadSampleData(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <div className="text-xs">
                    <div className="font-medium text-slate-200">Load sample app passwords</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Pre-populates sample accounts (GitHub, AWS, Netflix, Spotify, Stripe with live 2FA) to test right away.
                    </div>
                  </div>
                </label>

                {setupError && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{setupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isDecrypting}
                  className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isDecrypting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deriving AES-GCM Key (100k rounds)...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Create Encrypted Vault</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Emergency Key Confirmation Step */
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-2 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400 mb-1">
                    <FileCheck2 size={24} />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Vault Created & Encrypted!
                  </h2>
                  <p className="text-xs text-slate-400">
                    Save your Emergency Recovery Key in a secure place. If you ever forget your Master Password, this key provides emergency access.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                    Emergency Recovery Key
                  </div>
                  <div className="font-mono text-base font-bold text-cyan-300 tracking-wider text-center select-all py-1">
                    {emergencyKey}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadEmergencyKit}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Kit</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Unlock is already completed, closing setup
                  }}
                  className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Enter My Vault
                </button>
              </div>
            )
          ) : (
            /* Unlock Flow */
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Vault status: Locked</span>
                {quickPinEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setUsePinMode(!usePinMode);
                      setUnlockError('');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
                  >
                    {usePinMode ? 'Use Master Password' : 'Use Quick PIN'}
                  </button>
                )}
              </div>

              {usePinMode && quickPinEnabled ? (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Enter Quick PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    placeholder="••••"
                    value={unlockPin}
                    onChange={e => setUnlockPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono tracking-widest"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Master Password</label>
                  <div className="relative">
                    <input
                      type={showUnlockPwd ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Enter master password"
                      value={unlockPassword}
                      onChange={e => setUnlockPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlockPwd(!showUnlockPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showUnlockPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {unlockError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDecrypting}
                className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDecrypting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying Decryption Key...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={14} />
                    <span>Unlock Vault</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(!showResetConfirm)}
                  className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer"
                >
                  Forgot password or want to start fresh?
                </button>
              </div>

              {showResetConfirm && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/60 rounded-xl space-y-2 text-xs">
                  <div className="text-rose-300 font-medium">Reset Vault</div>
                  <div className="text-slate-400 text-[11px]">
                    If you forgot your password and have no backup, you can erase local data and set up a new vault.
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={wipeVault}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                    >
                      Erase & Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Security Guarantees Footer Bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
          <div>AES-256-GCM</div>
          <div>PBKDF2 SHA-256</div>
          <div>Zero-Knowledge</div>
        </div>
      </div>
    </div>
  );
};
