import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Key, 
  Download, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  Clock,
  FileText,
  KeyRound,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface VaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultSettingsModal: React.FC<VaultSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    autoLockMinutes,
    setAutoLockMinutes,
    quickPinEnabled,
    setQuickPin,
    changeMasterPassword,
    exportEncryptedBackup,
    importEncryptedBackup,
    wipeVault,
    items,
  } = useVault();

  const [activeTab, setActiveTab] = useState<'security' | 'password' | 'backup' | 'danger'>('security');

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Quick PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Import state
  const [importJson, setImportJson] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Wipe confirmation
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);

    if (newPassword.length < 8) {
      setPwdError('New master password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    const success = await changeMasterPassword(oldPassword, newPassword);
    if (success) {
      setPwdSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(false), 3000);
    } else {
      setPwdError('Current master password incorrect.');
    }
  };

  const handleSetPin = async () => {
    if (pinInput && pinInput.length >= 4) {
      await setQuickPin(pinInput);
      setPinInput('');
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 2000);
    }
  };

  const handleDisablePin = async () => {
    await setQuickPin(null);
  };

  const handleExport = () => {
    try {
      const backupData = exportEncryptedBackup();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kryptos-vault-backup-${new Date().toISOString().slice(0, 10)}.kryptovault.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess(false);

    if (!importJson.trim()) {
      setImportError('Please select or paste an encrypted backup file.');
      return;
    }
    if (!importPassword) {
      setImportError('Please enter the master password used to encrypt this backup.');
      return;
    }

    const success = await importEncryptedBackup(importJson, importPassword);
    if (success) {
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1500);
    } else {
      setImportError('Failed to decrypt backup. Incorrect password or invalid file format.');
    }
  };

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
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Vault Security & Settings</h2>
              <p className="text-xs text-slate-400">Zero-knowledge preferences & encrypted backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 shrink-0">
          {[
            { id: 'security', label: 'Security & Auto-Lock' },
            { id: 'password', label: 'Master Password' },
            { id: 'backup', label: 'Encrypted Backup' },
            { id: 'danger', label: 'Danger Zone' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Inactivity timeout */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Auto-Lock Inactivity Timeout</h3>
                </div>
                <p className="text-xs text-slate-400">
                  When idle, the vault wipes the decrypted state and encryption key from memory,
                  requiring your master password to unlock again.
                </p>

                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: 1, label: '1 min' },
                    { value: 5, label: '5 min' },
                    { value: 15, label: '15 min' },
                    { value: 30, label: '30 min' },
                    { value: 60, label: '1 hour' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAutoLockMinutes(opt.value)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors cursor-pointer ${
                        autoLockMinutes === opt.value
                          ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick PIN */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Session Quick PIN</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Set a 4-6 digit numeric PIN to quickly re-unlock the vault during your current browsing session without retyping your full master password.
                </p>

                {quickPinEnabled ? (
                  <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <ShieldCheck size={16} />
                      <span>Quick PIN is currently enabled</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisablePin}
                      className="px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Disable PIN
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Enter 4-6 digit PIN"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleSetPin}
                      disabled={pinInput.length < 4}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Enable PIN
                    </button>
                  </div>
                )}
                {pinSuccess && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> PIN configured successfully!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <p className="text-xs text-slate-400">
                Changing your master password will re-encrypt all {items.length} vault items with a newly derived 256-bit key from a fresh random cryptographic salt.
              </p>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Master Password</label>
                <div className="relative">
                  <input
                    type={showOldPwd ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showOldPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">New Master Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {pwdError && <div className="text-xs text-rose-400">{pwdError}</div>}
              {pwdSuccess && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Master password updated and vault re-encrypted!
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Update Master Password
              </button>
            </form>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Export */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Download size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Export Encrypted Backup</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Downloads an AES-256-GCM encrypted backup file (`.kryptovault.json`). Because the file is end-to-end encrypted, it cannot be read without your Master Password, making it safe to store on USB drives, Google Drive, or cloud storage.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Encrypted Vault ({items.length} items)</span>
                </button>
              </div>

              {/* Import */}
              <form onSubmit={handleImportSubmit} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Upload size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Restore from Encrypted Backup</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Select a previously exported `.kryptovault.json` backup file and enter the master password that was used when exporting it.
                </p>

                <div>
                  <input
                    type="file"
                    accept=".json,.kryptovault.json"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Backup Master Password</label>
                  <input
                    type="password"
                    placeholder="Enter password for this backup"
                    value={importPassword}
                    onChange={e => setImportPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {importError && <div className="text-xs text-rose-400">{importError}</div>}
                {importSuccess && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Vault restored and decrypted successfully!
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Restore & Decrypt Vault</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertTriangle size={16} />
                <span>Reset / Factory Wipe Vault</span>
              </div>
              <p className="text-xs text-slate-400">
                This will permanently delete all encrypted vault ciphertext, configuration, and master keys from this browser. This action is irreversible unless you have an exported backup.
              </p>

              {confirmWipe ? (
                <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl space-y-2">
                  <p className="text-xs text-rose-200 font-medium">
                    Are you absolutely sure? All {items.length} saved passwords will be deleted forever.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        wipeVault();
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Yes, Wipe All Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmWipe(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmWipe(true)}
                  className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Wipe All Vault Data</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
