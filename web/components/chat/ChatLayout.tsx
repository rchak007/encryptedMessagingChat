'use client';

import { useEffect, useState } from 'react';
import { Conversation, Message } from './types';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';
import { PublicKey } from '@solana/web3.js';

interface ChatLayoutProps {
  conversations: Conversation[];
  isLoading?: boolean;
  isDecryptionUnlocked?: boolean;
  onUnlockDecryption?: () => void;
  onSendMessage?: (conversationId: string, message: string) => Promise<void>;
  onNewConversation?: () => void;
}

export default function ChatLayout({
  conversations,
  isLoading = false,
  isDecryptionUnlocked = false,
  onUnlockDecryption = () => {},
  onSendMessage = async () => {},
  onNewConversation = () => {},
}: ChatLayoutProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Persist and apply theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('relay_chat_theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('relay_chat_theme', theme);
  }, [theme]);

  // Auto-select first conversation on large screens so the view isn't empty
  useEffect(() => {
    // On first render pick the first conversation, but don't fight user changes
    if (activeConversationId) return;
    if (conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowMobileSidebar(false); // Hide sidebar on mobile when selecting
  };

  const handleBack = () => {
    setShowMobileSidebar(true);
  };

  const handleSendMessage = async (message: string) => {
    if (activeConversationId) {
      await onSendMessage(activeConversationId, message);
    }
  };

  return (
    <div className="relative w-full min-h-[80vh] lg:min-h-[calc(100vh-120px)] flex flex-col lg:flex-row bg-base-100 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-base-200">
        <div className="font-semibold text-base-content">Messages</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn btn-sm btn-ghost"
            aria-label="Toggle theme"
            title="Toggle light/dark"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button
            type="button"
            onClick={() => setShowMobileSidebar(true)}
            className="btn btn-sm btn-ghost"
            aria-label="Open conversations"
          >
            ☰
          </button>
          <button
            type="button"
            onClick={onNewConversation}
            className="btn btn-sm btn-primary"
          >
            + New
          </button>
        </div>
      </div>

      {/* Sidebar - Conversation List */}
      {showMobileSidebar && (
        <button
          aria-label="Close conversations"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <div
        className={`z-40 lg:z-auto lg:static lg:min-w-[320px] lg:max-w-[360px] lg:w-[32vw] lg:border-r border-gray-700 flex-shrink-0 bg-base-200 transition-transform duration-200 ease-out
          ${showMobileSidebar ? 'fixed inset-y-0 left-0 w-full sm:w-4/5 max-w-sm shadow-2xl' : 'hidden lg:block'}
        `}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={onNewConversation}
          isLoading={isLoading}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          theme={theme}
        />
      </div>

      {/* Main - Conversation View */}
      <div className="flex-1 min-h-0 lg:min-h-[80vh]">
        <ConversationView
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          isDecryptionUnlocked={isDecryptionUnlocked}
          onUnlockDecryption={onUnlockDecryption}
        />
      </div>
    </div>
  );
}
