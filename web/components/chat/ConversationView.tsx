'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from './types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';
import { ellipsify } from '../ui/ui-layout';

interface ConversationViewProps {
  conversation: Conversation | null;
  onSendMessage: (message: string) => Promise<void>;
  onBack?: () => void;
  isDecryptionUnlocked: boolean;
  onUnlockDecryption: () => void;
}

export default function ConversationView({
  conversation,
  onSendMessage,
  onBack,
  isDecryptionUnlocked,
  onUnlockDecryption,
}: ConversationViewProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!isSearchOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages.length, isSearchOpen]);

  // Handle search results
  const handleSearchResults = (results: Message[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
  };

  // Navigate to specific message
  const handleNavigateToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Clear highlight after animation
    setTimeout(() => setHighlightedMessageId(null), 2000);
  };

  // Close search
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedMessageId(null);
  };

  // No conversation selected
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-100">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
          <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  const getConversationTitle = (): string => {
    if (conversation.type === 'group') {
      return conversation.name || `Group (${conversation.members.length})`;
    }
    return conversation.participant.displayName || ellipsify(conversation.participant.wallet, 8);
  };

  const getSubtitle = (): string => {
    if (conversation.type === 'group') {
      return `${conversation.members.length} members`;
    }
    return ellipsify(conversation.participant.wallet, 12);
  };

  return (
    <div className="flex-1 flex flex-col bg-base-100 relative min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-base-200">
        {/* Back button (mobile) */}
        {onBack && (
          <button onClick={onBack} className="btn btn-sm btn-ghost lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          conversation.type === 'group' ? 'bg-purple-600' : 'bg-cyan-600'
        }`}>
          {conversation.type === 'group' ? '👥' : '👤'}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base-content truncate">{getConversationTitle()}</h3>
          <p className="text-xs text-gray-500 truncate">{getSubtitle()}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="btn btn-sm btn-ghost"
            title="Search in conversation (Ctrl+F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Decrypt toggle */}
          <button
            onClick={onUnlockDecryption}
            className={`btn btn-sm ${isDecryptionUnlocked ? 'btn-success' : 'btn-warning'}`}
            title={isDecryptionUnlocked ? 'Decryption unlocked' : 'Unlock decryption'}
          >
            {isDecryptionUnlocked ? '🔓' : '🔒'}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <SearchBar
        messages={conversation.messages}
        onSearchResults={handleSearchResults}
        onNavigateToMessage={handleNavigateToMessage}
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
      />

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ paddingTop: isSearchOpen ? '80px' : '16px' }}
      >
        {conversation.messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👋</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Encryption notice */}
            <div className="text-center text-xs text-gray-500 mb-4 py-2 px-4 bg-base-200 rounded-lg">
              🔐 Messages are end-to-end encrypted with ML-KEM-768
            </div>

            {/* Message list */}
            {conversation.messages.map((message, index) => {
              const showSender =
                conversation.type === 'group' &&
                (index === 0 ||
                  conversation.messages[index - 1].sender !== message.sender);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showSender={showSender}
                  isHighlighted={highlightedMessageId === message.id}
                  searchQuery={searchQuery}
                />
              );
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Decryption unlock prompt */}
      {!isDecryptionUnlocked && (
        <div className="px-4 py-3 bg-yellow-900/30 border-t border-yellow-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <span>🔒</span>
              <span>Messages are encrypted. Unlock to read them.</span>
            </div>
            <button
              onClick={onUnlockDecryption}
              className="btn btn-sm btn-warning"
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={!isDecryptionUnlocked}
        placeholder={
          isDecryptionUnlocked
            ? 'Type a message...'
            : 'Unlock decryption to send messages'
        }
      />
    </div>
  );
}
