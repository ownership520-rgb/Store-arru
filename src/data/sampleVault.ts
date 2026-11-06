import { VaultItem } from '../types';

export const SAMPLE_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'vault-item-github',
    title: 'GitHub Developer Hub',
    category: 'login',
    username: 'alex.chen.sec@gmail.com',
    password: 'kR9$mQ#91vZb*T7!Lp',
    url: 'https://github.com/login',
    notes: 'Personal & organization repositories. Requires hardware FIDO2 key or TOTP code.',
    totpSecret: 'JBSWY3DPEHPK3PXP', // Valid test secret that generates live TOTP codes!
    customFields: [
      { id: 'f1', label: 'Recovery Code 1', value: '4a89-bc01-98fe', isSecret: true },
      { id: 'f2', label: 'SSH Key Fingerprint', value: 'SHA256:uN3h91k8L209pQq', isSecret: false }
    ],
    favorite: true,
    folder: 'Development',
    tags: ['work', 'git', '2fa-enabled'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    passwordHistory: [
      { password: 'OldP@ssw0rd2024!', changedAt: Date.now() - 86400000 * 95 }
    ]
  },
  {
    id: 'vault-item-aws',
    title: 'Amazon Web Services (AWS)',
    category: 'login',
    username: 'cloud-admin@nexus-systems.io',
    password: 'vX7!Wp@44*mQ91#LzT',
    url: 'https://signin.aws.amazon.com/console',
    notes: 'Production account ID: 902184729104. Root account MFA enabled.',
    totpSecret: 'KRSXG5CTMVRXEZLU',
    customFields: [
      { id: 'f3', label: 'Account ID', value: '902184729104', isSecret: false },
      { id: 'f4', label: 'Region', value: 'us-east-1', isSecret: false }
    ],
    favorite: true,
    folder: 'Infrastructure',
    tags: ['cloud', 'production', 'infra'],
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'vault-item-google',
    title: 'Google Workspace',
    category: 'login',
    username: 'alex.chen@enterprise.io',
    password: 'G7#9!pLz*Q44vW19@K',
    url: 'https://accounts.google.com',
    notes: 'Single Sign-On provider for corporate Slack, Jira, and Notion.',
    totpSecret: 'MZXW6YTBOI======',
    customFields: [
      { id: 'f5', label: 'Backup Email', value: 'chen.recovery@proton.me', isSecret: false }
    ],
    favorite: true,
    folder: 'Work',
    tags: ['sso', 'email', 'primary'],
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'vault-item-stripe',
    title: 'Stripe Merchant Dashboard',
    category: 'api_key',
    username: 'billing@nexus-systems.io',
    password: 'sTr!p3_99*QvLk!44#m',
    url: 'https://dashboard.stripe.com',
    notes: 'Live mode API keys and financial payout settings.',
    totpSecret: 'NBSWY3DPEHPK3PXP',
    customFields: [
      { id: 'f6', label: 'Live Secret Key', value: 'sk_live_51Mz9kQ88vLq0019A88cTq', isSecret: true },
      { id: 'f7', label: 'Webhook Signing Secret', value: 'whsec_99a81b2c3d4e', isSecret: true }
    ],
    favorite: false,
    folder: 'Finance',
    tags: ['payments', 'api', 'finance'],
    createdAt: Date.now() - 86400000 * 80,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'vault-item-netflix',
    title: 'Netflix Premium 4K',
    category: 'login',
    username: 'alex.home@gmail.com',
    password: 'summer2023!', // Intentionally weak to demonstrate security audit!
    url: 'https://netflix.com/login',
    notes: 'Family household profile. Master profile pin: 4920.',
    customFields: [
      { id: 'f8', label: 'Profile PIN', value: '4920', isSecret: true }
    ],
    favorite: false,
    folder: 'Personal',
    tags: ['entertainment', 'streaming'],
    createdAt: Date.now() - 86400000 * 180,
    updatedAt: Date.now() - 86400000 * 180,
  },
  {
    id: 'vault-item-spotify',
    title: 'Spotify Family',
    category: 'login',
    username: 'alex.home@gmail.com',
    password: 'summer2023!', // Intentionally reused to show security audit alert!
    url: 'https://accounts.spotify.com',
    notes: 'Linked to Hi-Fi sound system.',
    favorite: false,
    folder: 'Personal',
    tags: ['music', 'streaming'],
    createdAt: Date.now() - 86400000 * 150,
    updatedAt: Date.now() - 86400000 * 150,
  },
  {
    id: 'vault-item-server',
    title: 'Primary Edge Gateway SSH',
    category: 'server',
    username: 'root@192.168.1.1',
    password: 'eDg3#91*G@tew4y!00',
    url: 'ssh://admin@10.0.0.1:2222',
    notes: 'Wireguard VPN jump host and firewall manager.',
    customFields: [
      { id: 'f9', label: 'SSH Port', value: '2222', isSecret: false },
      { id: 'f10', label: 'Passphrase', value: 'omega-titan-vector-matrix', isSecret: true }
    ],
    favorite: false,
    folder: 'Infrastructure',
    tags: ['ssh', 'network', 'gateway'],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'vault-item-secure-note',
    title: 'Emergency Banking Recovery Codes',
    category: 'secure_note',
    username: 'Alex Chen',
    notes: `Primary Account: Chase Private Client #8829-1092-4911
Wire Routing: 021000021
Emergency Phone Verification PIN: 849201
Power of Attorney notary reference: NY-2025-DOC-89412
Safe deposit box #412 at 5th Ave Branch.`,
    favorite: true,
    folder: 'Finance',
    tags: ['confidential', 'banking', 'offline'],
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 30,
  }
];
