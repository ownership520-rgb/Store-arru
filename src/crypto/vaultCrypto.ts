/**
 * End-to-End Cryptography Engine for Kryptos Vault
 * Utilizes native Web Crypto API (AES-GCM 256-bit + PBKDF2 SHA-256 + HMAC-SHA1 for TOTP)
 */

import { EncryptedPayload, GeneratorOptions, PasswordStrength, VaultItem } from '../types';

const CANARY_PHRASE = 'KRYPTOS_VAULT_DECRYPTION_CANARY_V1';
const PBKDF2_ITERATIONS = 100000;

// Helper: Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate cryptographically secure random bytes
export function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

/**
 * Derive AES-GCM 256-bit key from Master Password and Salt using PBKDF2
 */
export async function deriveKeyFromPassword(
  masterPassword: string,
  saltBuffer: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  // Import raw password into key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive AES-GCM 256-bit key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as unknown as BufferSource,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable for memory protection
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt arbitrary JSON data with AES-GCM 256-bit
 */
export async function encryptVault(
  items: VaultItem[],
  cryptoKey: CryptoKey,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const rawData = encoder.encode(JSON.stringify(items));

  // Generate 12-byte random IV for AES-GCM
  const iv = getRandomBytes(12);

  // Encrypt items payload
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    rawData
  );

  // Encrypt verification canary phrase with a distinct IV to verify password without leaking items
  const canaryIv = getRandomBytes(12);
  const canaryBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: canaryIv as unknown as BufferSource,
    },
    cryptoKey,
    encoder.encode(CANARY_PHRASE)
  );

  // Bundle canary iv + ciphertext into verificationToken
  const canaryCombined = new Uint8Array(canaryIv.length + canaryBuffer.byteLength);
  canaryCombined.set(canaryIv, 0);
  canaryCombined.set(new Uint8Array(canaryBuffer), canaryIv.length);

  return {
    version: 1,
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    iterations: iterations,
    ciphertext: bufferToBase64(ciphertextBuffer),
    verificationToken: bufferToBase64(canaryCombined),
  };
}

/**
 * Verify if key is valid using the verification canary
 */
export async function verifyKey(
  cryptoKey: CryptoKey,
  verificationTokenBase64: string
): Promise<boolean> {
  try {
    const combined = base64ToBuffer(verificationTokenBase64);
    if (combined.length < 13) return false;

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      cryptoKey,
      ciphertext as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedBuffer);
    return result === CANARY_PHRASE;
  } catch {
    return false;
  }
}

/**
 * Decrypt AES-GCM 256-bit encrypted vault data
 */
export async function decryptVault(
  encryptedCiphertextBase64: string,
  ivBase64: string,
  cryptoKey: CryptoKey
): Promise<VaultItem[]> {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(encryptedCiphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as VaultItem[];
}

/**
 * Simple quick SHA-256 hash for PIN or local verification
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

/**
 * Generate a 24-character hex Emergency Recovery Key
 */
export function generateEmergencyKey(): string {
  const bytes = getRandomBytes(16);
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  // Format into 4 chunks of 8 characters: XXXX-XXXX-XXXX-XXXX
  return hex.match(/.{1,4}/g)?.join('-') || hex;
}

/**
 * RFC 6238 Standard TOTP Generator (HMAC-SHA1 with Base32 decoding)
 */
export async function generateTOTP(secretBase32: string): Promise<{ code: string; secondsRemaining: number }> {
  try {
    const cleanSecret = secretBase32.replace(/[\s-]/g, '').toUpperCase();
    const keyBytes = base32ToBytes(cleanSecret);

    const epochSeconds = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epochSeconds / timeStep);
    const secondsRemaining = timeStep - (epochSeconds % timeStep);

    // Convert counter into 8-byte big-endian buffer
    const counterBuffer = new Uint8Array(8);
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      counterBuffer[i] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }

    // Import HMAC key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    // Calculate HMAC-SHA1
    const hmacResult = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      counterBuffer as unknown as BufferSource
    );
    const hmacBytes = new Uint8Array(hmacResult);

    // Dynamic truncation per RFC 4226 / 6238
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const formattedCode = otp.toString().padStart(6, '0');

    return { code: formattedCode, secondsRemaining };
  } catch {
    return { code: '------', secondsRemaining: 30 };
  }
}

// Base32 RFC 4648 decoder
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.charAt(i));
    if (val === -1) continue; // Skip padding or invalid characters
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

/**
 * Wordlist for Diceware Passphrase Generation
 */
const PASSPHRASE_WORDS = [
  'anchor', 'beacon', 'breeze', 'canyon', 'castle', 'cipher', 'clover', 'cosmic',
  'crater', 'crystal', 'dolphin', 'dragon', 'eclipse', 'ember', 'falcon', 'feather',
  'flame', 'forest', 'frost', 'galaxy', 'glacier', 'granite', 'harbor', 'horizon',
  'island', 'jaguar', 'jungle', 'knight', 'lagoon', 'lantern', 'meadow', 'meteor',
  'monarch', 'nebula', 'oasis', 'ocean', 'orbit', 'origin', 'phoenix', 'planet',
  'polar', 'portal', 'prism', 'quasar', 'radiant', 'rain', 'ranger', 'raven',
  'ripple', 'river', 'rocket', 'sable', 'safari', 'shadow', 'shield', 'sierra',
  'silver', 'solar', 'spark', 'spire', 'storm', 'stride', 'summit', 'sunset',
  'temple', 'thunder', 'timber', 'topaz', 'torrent', 'tower', 'trail', 'tundra',
  'valley', 'vapor', 'velvet', 'vortex', 'voyage', 'whisper', 'willow', 'zenith'
];

/**
 * High-Entropy Secure Password Generator
 */
export function generatePassword(options: GeneratorOptions): string {
  if (options.mode === 'passphrase') {
    const selectedWords: string[] = [];
    const count = Math.max(3, Math.min(8, options.wordCount));
    const randomArray = new Uint32Array(count);
    window.crypto.getRandomValues(randomArray);

    for (let i = 0; i < count; i++) {
      let word = PASSPHRASE_WORDS[randomArray[i] % PASSPHRASE_WORDS.length];
      if (options.capitalizeWords) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      selectedWords.push(word);
    }
    return selectedWords.join(options.separator || '-');
  }

  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O if avoidAmbiguous
  const upperAll = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz'; // Removed l if avoidAmbiguous
  const lowerAll = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '23456789'; // Removed 0, 1 if avoidAmbiguous
  const numbersAll = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charPool = '';
  const mandatoryChars: string[] = [];

  const useUpperChars = options.avoidAmbiguous ? upper : upperAll;
  const useLowerChars = options.avoidAmbiguous ? lower : lowerAll;
  const useNumberChars = options.avoidAmbiguous ? numbers : numbersAll;

  if (options.useUpper) {
    charPool += useUpperChars;
    mandatoryChars.push(getRandomChar(useUpperChars));
  }
  if (options.useLower) {
    charPool += useLowerChars;
    mandatoryChars.push(getRandomChar(useLowerChars));
  }
  if (options.useNumbers) {
    charPool += useNumberChars;
    mandatoryChars.push(getRandomChar(useNumberChars));
  }
  if (options.useSymbols) {
    charPool += symbols;
    mandatoryChars.push(getRandomChar(symbols));
  }

  if (charPool === '') {
    charPool = useLowerChars + useNumberChars;
  }

  const length = Math.max(8, Math.min(64, options.length));
  const remainingLength = Math.max(0, length - mandatoryChars.length);
  const randomArray = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(randomArray);

  const resultChars: string[] = [...mandatoryChars];
  for (let i = 0; i < remainingLength; i++) {
    resultChars.push(charPool[randomArray[i] % charPool.length]);
  }

  // Cryptographically shuffle the result array
  const shuffleBytes = new Uint32Array(resultChars.length);
  window.crypto.getRandomValues(shuffleBytes);
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [resultChars[i], resultChars[j]] = [resultChars[j], resultChars[i]];
  }

  return resultChars.join('');
}

function getRandomChar(set: string): string {
  const random = new Uint32Array(1);
  window.crypto.getRandomValues(random);
  return set[random[0] % set.length];
}

/**
 * Calculate Password Entropy and Quality Checklist
 */
export function analyzePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      color: 'text-rose-500',
      entropy: 0,
      checks: {
        length: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSymbol: false,
        notCommon: true,
      },
    };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const lengthCheck = password.length >= 14;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  // Shannon Entropy: E = L * log2(R)
  const entropy = Math.round(password.length * (poolSize > 0 ? Math.log2(poolSize) : 0));

  const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'welcome', 'letmein', 'pass123'];
  const notCommon = !commonPasswords.some(common => password.toLowerCase().includes(common));

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12 && ((hasLower && hasUpper) || (hasNumber && hasSymbol))) score++;
  if (password.length >= 16 && (hasLower && hasUpper && hasNumber)) score++;
  if (entropy >= 80 && hasSymbol && notCommon) score = 4;

  let label: PasswordStrength['label'] = 'Very Weak';
  let color = 'text-rose-400';

  if (score === 1) {
    label = 'Weak';
    color = 'text-amber-500';
  } else if (score === 2) {
    label = 'Fair';
    color = 'text-yellow-400';
  } else if (score === 3) {
    label = 'Strong';
    color = 'text-emerald-400';
  } else if (score === 4) {
    label = 'Fortress';
    color = 'text-cyan-400';
  }

  return {
    score,
    label,
    color,
    entropy,
    checks: {
      length: lengthCheck,
      hasLower,
      hasUpper,
      hasNumber,
      hasSymbol,
      notCommon,
    },
  };
}
