/**
 * Kryptos Vault - Zero-Knowledge End-to-End Encrypted Password Manager
 * Client-Side AES-256-GCM + PBKDF2 SHA-256 with 100,000 Rounds
 */

import React, { useState, useEffect } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { VaultUnlock } from './components/VaultUnlock';
import { VaultHeader } from './components/VaultHeader';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultItemList } from './components/VaultItemList';
import { VaultItemModal } from './components/VaultItemModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { TOTPAuthenticatorModal } from './components/TOTPAuthenticatorModal';
import { VaultSettingsModal } from './components/VaultSettingsModal';
import { ClipboardToast } from './components/ClipboardToast';
import { VaultItem } from './types';

const VaultMainContent: React.FC = () => {
  const { isLocked, isInitialized, lockVault } = useVault();

  // Navigation state
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global keyboard shortcuts (Ctrl/Cmd + L to lock, Ctrl/Cmd + N for new item)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockVault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !isLocked) {
        e.preventDefault();
        setEditingItem(null);
        setIsItemModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g' && !isLocked) {
        e.preventDefault();
        setIsGeneratorOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockVault, isLocked]);

  if (!isInitialized || isLocked) {
    return <VaultUnlock />;
  }

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: VaultItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar Header */}
      <VaultHeader
        currentView={currentCategory}
        onSelectView={view => {
          setCurrentCategory(view);
          setSelectedTag(null);
          setSelectedFolder(null);
        }}
        onNewItem={handleOpenNewItem}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpen2FA={() => setIs2FAOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <VaultSidebar
          currentCategory={currentCategory}
          onSelectCategory={cat => {
            setCurrentCategory(cat);
            setSelectedTag(null);
            setSelectedFolder(null);
          }}
          selectedTag={selectedTag}
          onSelectTag={tag => {
            setSelectedTag(tag);
            setSelectedFolder(null);
          }}
          selectedFolder={selectedFolder}
          onSelectFolder={folder => {
            setSelectedFolder(folder);
            setSelectedTag(null);
          }}
          onOpenAudit={() => setIsAuditOpen(true)}
          onOpenGenerator={() => setIsGeneratorOpen(true)}
          onOpen2FA={() => setIs2FAOpen(true)}
        />

        {/* Center & Detail Split View */}
        <VaultItemList
          category={currentCategory}
          selectedTag={selectedTag}
          selectedFolder={selectedFolder}
          onEditItem={handleEditItem}
          onNewItem={handleOpenNewItem}
        />
      </div>

      {/* Modals & Overlays */}
      <VaultItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        initialItem={editingItem}
        defaultCategory={
          currentCategory !== 'all' && currentCategory !== 'favorites' && currentCategory !== 'trash'
            ? (currentCategory as any)
            : 'login'
        }
      />

      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />

      <SecurityAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        onEditItem={handleEditItem}
      />

      <TOTPAuthenticatorModal
        isOpen={is2FAOpen}
        onClose={() => setIs2FAOpen(false)}
        onAddNewWith2FA={handleOpenNewItem}
      />

      <VaultSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Clipboard Auto-Purge Toast */}
      <ClipboardToast />
    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <VaultMainContent />
    </VaultProvider>
  );
}
