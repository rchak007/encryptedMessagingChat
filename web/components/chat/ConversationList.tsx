'use client';

import { useState } from 'react';
import { Conversation } from './types';
import { ellipsify } from '../ui/ui-layout';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
  onToggleTheme?: () => void;
  theme?: 'dark' | 'light';
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading = false,
  onToggleTheme,
  theme = 'dark',
}: ConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all');

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'all') return true;
    return conv.type === filter;
  });

  const getConversationName = (conv: Conversation): string => {
    if (conv.type === 'group') {
      return conv.name || `Group (${conv.members.length})`;
    }
    return conv.participant.displayName || ellipsify(conv.participant.wallet, 6);
  };

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.lastMessage) return 'No messages yet';
    if (!conv.lastMessage.isDecrypted) return '🔒 Encrypted message';
    const content = conv.lastMessage.content;
    return content.length > 40 ? content.slice(0, 40) + '...' : content;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-base-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-base-200">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-lg font-bold text-base-content">Messages</h2>
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="btn btn-sm btn-ghost"
                title="Toggle light/dark"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
            )}
          <button
            type="button"
            onClick={onNewConversation}
            className="btn btn-sm btn-primary"
          >
            + New
          </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'direct', 'group'] as const).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-300 text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f === 'direct' ? '1:1' : 'Groups'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm">No conversations yet</p>
            <button
              onClick={onNewConversation}
              className="btn btn-sm btn-ghost mt-2 text-primary"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {filteredConversations.map((conv) => (
              <button
                type="button"
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-4 text-left hover:bg-base-300 transition-colors ${
                  activeConversationId === conv.id ? 'bg-base-300' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    conv.type === 'group' ? 'bg-purple-600' : 'bg-cyan-600'
                  }`}>
                    {conv.type === 'group' ? '👥' : '👤'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-base-content truncate">
                        {getConversationName(conv)}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {getLastMessagePreview(conv)}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-content rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
