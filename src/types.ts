/**
 * Types and interfaces for Kryptos End-to-End Encrypted Password Vault
 */

export type ItemCategory = 
  | 'login' 
  | 'secure_note' 
  | 'credit_card' 
  | 'api_key' 
  | 'server';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
}

export interface PasswordHistoryEntry {
  password: string;
  changedAt: number;
}

export interface VaultItem {
  id: string;
  title: string;
  category: ItemCategory;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  totpSecret?: string; // Base32 encoded TOTP key for 2FA
  customFields?: CustomField[];
  favorite: boolean;
  folder?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  passwordHistory?: PasswordHistoryEntry[];
  trashed?: boolean;
}

export interface EncryptedPayload {
  version: number;
  iv: string; // Base64
  salt: string; // Base64
  iterations: number;
  ciphertext: string; // Base64
  verificationToken: string; // Base64 canary encrypted with same key to verify password
}

export interface StoredVaultState {
  isInitialized: boolean;
  salt: string;
  iterations: number;
  verificationToken: string;
  encryptedVault: string; // Base64 ciphertext
  iv: string;
  quickPinHash?: string;
  autoLockMinutes: number;
  updatedAt: number;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Fortress';
  color: string;
  entropy: number;
  checks: {
    length: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    notCommon: boolean;
  };
}

export interface GeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  avoidAmbiguous: boolean;
  mode: 'password' | 'passphrase';
  wordCount: number;
  separator: string;
  capitalizeWords: boolean;
}

export interface SecurityAuditReport {
  overallScore: number;
  totalLogins: number;
  weakCount: number;
  reusedCount: number;
  no2faCount: number;
  oldPasswordCount: number;
  reusedGroups: { password: string; items: VaultItem[] }[];
  weakItems: VaultItem[];
  missing2faItems: VaultItem[];
  oldItems: VaultItem[];
}
