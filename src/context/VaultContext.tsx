/**
 * Kryptos Vault Context - Zero-Knowledge End-to-End Encryption Manager
 * Holds decrypted credentials only in RAM while unlocked; persists strictly AES-GCM 256-bit ciphertext.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  VaultItem,
  StoredVaultState,
  SecurityAuditReport,
} from '../types';
import {
  deriveKeyFromPassword,
  encryptVault,
  decryptVault,
  verifyKey,
  getRandomBytes,
  bufferToBase64,
  base64ToBuffer,
  generateEmergencyKey,
  hashString,
  analyzePasswordStrength,
} from '../crypto/vaultCrypto';
import { SAMPLE_VAULT_ITEMS } from '../data/sampleVault';

const VAULT_STORAGE_KEY = 'kryptos_e2e_vault_v1';

interface VaultContextType {
  isInitialized: boolean;
  isLocked: boolean;
  items: VaultItem[];
  autoLockMinutes: number;
  quickPinEnabled: boolean;
  clipboardNotification: { text: string; secondsLeft: number } | null;
  initializeVault: (
    masterPassword: string,
    loadSampleData?: boolean,
    quickPin?: string
  ) => Promise<{ emergencyKey: string }>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (item: VaultItem) => Promise<void>;
  deleteItem: (id: string, permanent?: boolean) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  setQuickPin: (pin: string | null) => Promise<void>;
  setAutoLockMinutes: (minutes: number) => void;
  exportEncryptedBackup: () => string;
  importEncryptedBackup: (backupJson: string, backupMasterPassword: string) => Promise<boolean>;
  wipeVault: () => void;
  copyToClipboard: (text: string, label: string) => Promise<void>;
  getSecurityAudit: () => SecurityAuditReport;
  lastActiveTime: number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(15);
  const [quickPinEnabled, setQuickPinEnabled] = useState<boolean>(false);
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
  const [clipboardNotification, setClipboardNotification] = useState<{
    text: string;
    secondsLeft: number;
  } | null>(null);

  // In-memory non-extractable CryptoKey (never written to disk or storage)
  const masterKeyRef = useRef<CryptoKey | null>(null);
  const cachedPasswordRef = useRef<string | null>(null);
  const clipboardTimerRef = useRef<number | null>(null);

  // Check stored vault on mount
  useEffect(() => {
    const rawData = localStorage.getItem(VAULT_STORAGE_KEY);
    if (rawData) {
      try {
        const stored: StoredVaultState = JSON.parse(rawData);
        if (stored.isInitialized && stored.verificationToken && stored.encryptedVault) {
          setIsInitialized(true);
          setIsLocked(true);
          setAutoLockMinutesState(stored.autoLockMinutes || 15);
          setQuickPinEnabled(!!stored.quickPinHash);
        }
      } catch (err) {
        console.error('Failed to parse stored vault metadata:', err);
      }
    }
  }, []);

  // Update activity timestamp on user interaction
  const recordActivity = useCallback(() => {
    setLastActiveTime(Date.now());
  }, []);

  useEffect(() => {
    const handleUserActivity = () => {
      recordActivity();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [recordActivity]);

  // Lock vault helper: Purges all decrypted state from memory
  const lockVault = useCallback(() => {
    masterKeyRef.current = null;
    cachedPasswordRef.current = null;
    setItems([]);
    setIsLocked(true);
  }, []);

  // Auto-lock timer based on autoLockMinutes
  useEffect(() => {
    if (isLocked || autoLockMinutes <= 0) return;

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - lastActiveTime) / 60000;
      if (elapsedMinutes >= autoLockMinutes) {
        lockVault();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLocked, autoLockMinutes, lastActiveTime, lockVault]);

  // Persist updated encrypted vault data to localStorage
  const saveEncryptedVault = useCallback(
    async (newItems: VaultItem[], key: CryptoKey) => {
      const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
      if (!rawStored) return;

      const stored: StoredVaultState = JSON.parse(rawStored);
      const saltBuffer = base64ToBuffer(stored.salt);

      const encrypted = await encryptVault(
        newItems,
        key,
        saltBuffer,
        stored.iterations || 100000
      );

      const updatedState: StoredVaultState = {
        ...stored,
        encryptedVault: encrypted.ciphertext,
        iv: encrypted.iv,
        verificationToken: encrypted.verificationToken,
        updatedAt: Date.now(),
      };

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedState));
    },
    []
  );

  // Initialize a fresh vault
  const initializeVault = async (
    masterPassword: string,
    loadSampleData: boolean = true,
    quickPin?: string
  ): Promise<{ emergencyKey: string }> => {
    const salt = getRandomBytes(16);
    const iterations = 100000;
    const key = await deriveKeyFromPassword(masterPassword, salt, iterations);

    const initialItems = loadSampleData ? SAMPLE_VAULT_ITEMS : [];
    const encrypted = await encryptVault(initialItems, key, salt, iterations);

    let quickPinHash: string | undefined = undefined;
    if (quickPin && quickPin.length >= 4) {
      quickPinHash = await hashString(quickPin);
    }

    const state: StoredVaultState = {
      isInitialized: true,
      salt: bufferToBase64(salt),
      iterations,
      verificationToken: encrypted.verificationToken,
      encryptedVault: encrypted.ciphertext,
      iv: encrypted.iv,
      quickPinHash,
      autoLockMinutes: 15,
      updatedAt: Date.now(),
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(state));

    masterKeyRef.current = key;
    cachedPasswordRef.current = masterPassword;
    setItems(initialItems);
    setIsInitialized(true);
    setIsLocked(false);
    setQuickPinEnabled(!!quickPinHash);

    const emergencyKey = generateEmergencyKey();
    return { emergencyKey };
  };

  // Unlock vault using Master Password
  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawStored) return false;

    try {
      const stored: StoredVaultState = JSON.parse(rawStored);
      const salt = base64ToBuffer(stored.salt);
      const key = await deriveKeyFromPassword(masterPassword, salt, stored.iterations);

      const isValid = await verifyKey(key, stored.verificationToken);
      if (!isValid) {
        return false;
      }

      const decryptedItems = await decryptVault(stored.encryptedVault, stored.iv, key);

      masterKeyRef.current = key;
      cachedPasswordRef.current = masterPassword;
      setItems(decryptedItems);
      setIsLocked(false);
      setLastActiveTime(Date.now());
      return true;
    } catch (err) {
      console.error('Decryption failed:', err);
      return false;
    }
  };

  // Unlock with Quick PIN (if enabled)
  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawStored) return false;

    try {
      const stored: StoredVaultState = JSON.parse(rawStored);
      if (!stored.quickPinHash) return false;

      const inputHash = await hashString(pin);
      if (inputHash !== stored.quickPinHash) {
        return false;
      }

      // If user unlocked before in this browser session or cached memory
      if (cachedPasswordRef.current) {
        return unlockVault(cachedPasswordRef.current);
      }

      return false;
    } catch {
      return false;
    }
  };

  // Add Item
  const addItem = async (itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!masterKeyRef.current) throw new Error('Vault is locked');

    const now = Date.now();
    const newItem: VaultItem = {
      ...itemData,
      id: 'item_' + now + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
      passwordHistory: itemData.password ? [{ password: itemData.password, changedAt: now }] : [],
    };

    const updated = [newItem, ...items];
    setItems(updated);
    await saveEncryptedVault(updated, masterKeyRef.current);
    recordActivity();
  };

  // Update Item
  const updateItem = async (updatedItem: VaultItem) => {
    if (!masterKeyRef.current) throw new Error('Vault is locked');

    const now = Date.now();
    const oldItem = items.find(i => i.id === updatedItem.id);
    let history = oldItem?.passwordHistory || [];

    // Track password change history
    if (oldItem && oldItem.password && updatedItem.password && oldItem.password !== updatedItem.password) {
      history = [{ password: oldItem.password, changedAt: now }, ...history].slice(0, 10);
    }

    const itemToSave: VaultItem = {
      ...updatedItem,
      updatedAt: now,
      passwordHistory: history,
    };

    const updated = items.map(i => (i.id === updatedItem.id ? itemToSave : i));
    setItems(updated);
    await saveEncryptedVault(updated, masterKeyRef.current);
    recordActivity();
  };

  // Delete / Trash Item
  const deleteItem = async (id: string, permanent: boolean = false) => {
    if (!masterKeyRef.current) throw new Error('Vault is locked');

    let updated: VaultItem[];
    if (permanent) {
      updated = items.filter(i => i.id !== id);
    } else {
      updated = items.map(i => (i.id === id ? { ...i, trashed: true, updatedAt: Date.now() } : i));
    }

    setItems(updated);
    await saveEncryptedVault(updated, masterKeyRef.current);
    recordActivity();
  };

  // Restore Item from Trash
  const restoreItem = async (id: string) => {
    if (!masterKeyRef.current) throw new Error('Vault is locked');

    const updated = items.map(i => (i.id === id ? { ...i, trashed: false, updatedAt: Date.now() } : i));
    setItems(updated);
    await saveEncryptedVault(updated, masterKeyRef.current);
    recordActivity();
  };

  // Toggle Favorite
  const toggleFavorite = async (id: string) => {
    if (!masterKeyRef.current) return;

    const updated = items.map(i => (i.id === id ? { ...i, favorite: !i.favorite } : i));
    setItems(updated);
    await saveEncryptedVault(updated, masterKeyRef.current);
  };

  // Change Master Password
  const changeMasterPassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawStored) return false;

    const stored: StoredVaultState = JSON.parse(rawStored);
    const salt = base64ToBuffer(stored.salt);
    const oldKey = await deriveKeyFromPassword(oldPass, salt, stored.iterations);

    const isValid = await verifyKey(oldKey, stored.verificationToken);
    if (!isValid) return false;

    // Generate fresh salt and new key
    const newSalt = getRandomBytes(16);
    const newKey = await deriveKeyFromPassword(newPass, newSalt, stored.iterations);
    const encrypted = await encryptVault(items, newKey, newSalt, stored.iterations);

    const updatedState: StoredVaultState = {
      ...stored,
      salt: bufferToBase64(newSalt),
      verificationToken: encrypted.verificationToken,
      encryptedVault: encrypted.ciphertext,
      iv: encrypted.iv,
      updatedAt: Date.now(),
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedState));
    masterKeyRef.current = newKey;
    cachedPasswordRef.current = newPass;
    return true;
  };

  // Set / Remove quick PIN
  const setQuickPin = async (pin: string | null) => {
    const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawStored) return;

    const stored: StoredVaultState = JSON.parse(rawStored);
    const quickPinHash = pin ? await hashString(pin) : undefined;

    const updatedState: StoredVaultState = {
      ...stored,
      quickPinHash,
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedState));
    setQuickPinEnabled(!!quickPinHash);
  };

  // Set Auto-lock timeout
  const setAutoLockMinutes = (minutes: number) => {
    setAutoLockMinutesState(minutes);
    const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (rawStored) {
      const stored: StoredVaultState = JSON.parse(rawStored);
      stored.autoLockMinutes = minutes;
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(stored));
    }
  };

  // Export Encrypted Backup (Zero-Knowledge, Safe for external storage)
  const exportEncryptedBackup = (): string => {
    const rawStored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawStored) throw new Error('No vault data to export');

    const stored: StoredVaultState = JSON.parse(rawStored);
    const exportBundle = {
      app: 'Kryptos Vault',
      exportFormat: 'AES-256-GCM-PBKDF2',
      version: 1,
      exportedAt: new Date().toISOString(),
      salt: stored.salt,
      iterations: stored.iterations,
      iv: stored.iv,
      verificationToken: stored.verificationToken,
      encryptedVault: stored.encryptedVault,
      itemCount: items.length,
    };

    return JSON.stringify(exportBundle, null, 2);
  };

  // Import Encrypted Backup
  const importEncryptedBackup = async (
    backupJson: string,
    backupMasterPassword: string
  ): Promise<boolean> => {
    try {
      const parsed = JSON.parse(backupJson);
      if (!parsed.encryptedVault || !parsed.iv || !parsed.salt || !parsed.verificationToken) {
        return false;
      }

      const salt = base64ToBuffer(parsed.salt);
      const iterations = parsed.iterations || 100000;
      const key = await deriveKeyFromPassword(backupMasterPassword, salt, iterations);

      const isValid = await verifyKey(key, parsed.verificationToken);
      if (!isValid) return false;

      const decryptedItems = await decryptVault(parsed.encryptedVault, parsed.iv, key);

      const newState: StoredVaultState = {
        isInitialized: true,
        salt: parsed.salt,
        iterations,
        verificationToken: parsed.verificationToken,
        encryptedVault: parsed.encryptedVault,
        iv: parsed.iv,
        autoLockMinutes: 15,
        updatedAt: Date.now(),
      };

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(newState));
      masterKeyRef.current = key;
      cachedPasswordRef.current = backupMasterPassword;
      setItems(decryptedItems);
      setIsInitialized(true);
      setIsLocked(false);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  // Factory reset vault
  const wipeVault = () => {
    localStorage.removeItem(VAULT_STORAGE_KEY);
    masterKeyRef.current = null;
    cachedPasswordRef.current = null;
    setItems([]);
    setIsInitialized(false);
    setIsLocked(true);
    setQuickPinEnabled(false);
  };

  // Secure Clipboard Copy with automatic purge
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);

      if (clipboardTimerRef.current) {
        clearInterval(clipboardTimerRef.current);
      }

      let seconds = 30;
      setClipboardNotification({ text: `${label} copied to clipboard`, secondsLeft: seconds });

      clipboardTimerRef.current = window.setInterval(async () => {
        seconds -= 1;
        if (seconds <= 0) {
          if (clipboardTimerRef.current) clearInterval(clipboardTimerRef.current);
          setClipboardNotification(null);
          // Try to clear clipboard if it still contains the sensitive item
          try {
            await navigator.clipboard.writeText('');
          } catch {
            // Permission might be denied in background
          }
        } else {
          setClipboardNotification({ text: `${label} copied to clipboard`, secondsLeft: seconds });
        }
      }, 1000);
    } catch {
      // Fallback
      setClipboardNotification({ text: `${label} copied`, secondsLeft: 3 });
      setTimeout(() => setClipboardNotification(null), 3000);
    }
  };

  // Security Audit Report Calculation
  const getSecurityAudit = useCallback((): SecurityAuditReport => {
    const activeItems = items.filter(i => !i.trashed && i.category === 'login');
    const totalLogins = activeItems.length;

    if (totalLogins === 0) {
      return {
        overallScore: 100,
        totalLogins: 0,
        weakCount: 0,
        reusedCount: 0,
        no2faCount: 0,
        oldPasswordCount: 0,
        reusedGroups: [],
        weakItems: [],
        missing2faItems: [],
        oldItems: [],
      };
    }

    const weakItems: VaultItem[] = [];
    const passwordMap = new Map<string, VaultItem[]>();
    const missing2faItems: VaultItem[] = [];
    const oldItems: VaultItem[] = [];
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    activeItems.forEach(item => {
      const pass = item.password || '';
      const strength = analyzePasswordStrength(pass);

      if (strength.score < 3) {
        weakItems.push(item);
      }

      if (!item.totpSecret) {
        missing2faItems.push(item);
      }

      if (item.updatedAt < ninetyDaysAgo) {
        oldItems.push(item);
      }

      if (pass) {
        const group = passwordMap.get(pass) || [];
        group.push(item);
        passwordMap.set(pass, group);
      }
    });

    const reusedGroups: { password: string; items: VaultItem[] }[] = [];
    let reusedCount = 0;
    passwordMap.forEach((matchedItems, pass) => {
      if (matchedItems.length > 1) {
        reusedGroups.push({ password: pass, items: matchedItems });
        reusedCount += matchedItems.length;
      }
    });

    // Score deduction
    let score = 100;
    score -= (weakItems.length / totalLogins) * 35;
    score -= (reusedCount / totalLogins) * 35;
    score -= (missing2faItems.length / totalLogins) * 20;
    score -= (oldItems.length / totalLogins) * 10;
    score = Math.max(0, Math.round(score));

    return {
      overallScore: score,
      totalLogins,
      weakCount: weakItems.length,
      reusedCount,
      no2faCount: missing2faItems.length,
      oldPasswordCount: oldItems.length,
      reusedGroups,
      weakItems,
      missing2faItems,
      oldItems,
    };
  }, [items]);

  return (
    <VaultContext.Provider
      value={{
        isInitialized,
        isLocked,
        items,
        autoLockMinutes,
        quickPinEnabled,
        clipboardNotification,
        initializeVault,
        unlockVault,
        unlockWithPin,
        lockVault,
        addItem,
        updateItem,
        deleteItem,
        restoreItem,
        toggleFavorite,
        changeMasterPassword,
        setQuickPin,
        setAutoLockMinutes,
        exportEncryptedBackup,
        importEncryptedBackup,
        wipeVault,
        copyToClipboard,
        getSecurityAudit,
        lastActiveTime,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
