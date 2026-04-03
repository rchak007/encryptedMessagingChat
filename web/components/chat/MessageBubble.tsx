'use client';

import { Message } from './types';
import { ellipsify } from '../ui/ui-layout';

interface MessageBubbleProps {
  message: Message;
  showSender?: boolean;
  isHighlighted?: boolean;
  searchQuery?: string;
}

export default function MessageBubble({
  message,
  showSender = false,
  isHighlighted = false,
  searchQuery = '',
}: MessageBubbleProps) {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Highlight search matches in text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/50 text-white rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const renderContent = () => {
    if (!message.isDecrypted) {
      return (
        <div className="flex items-center gap-2 text-gray-400 italic">
          <span>🔒</span>
          <span>Encrypted message</span>
        </div>
      );
    }

    if (message.decryptionError) {
      return (
        <div className="flex items-center gap-2 text-red-400 italic">
          <span>⚠️</span>
          <span>Failed to decrypt</span>
        </div>
      );
    }

    return (
      <p className="whitespace-pre-wrap break-words">
        {highlightText(message.content, searchQuery)}
      </p>
    );
  };

  return (
    <div
      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-2`}
      id={`message-${message.id}`}
    >
      <div
        className={`max-w-[75%] ${
          isHighlighted ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-base-100' : ''
        }`}
      >
        {/* Sender name (for group chats) */}
        {showSender && !message.isOwn && (
          <div className="text-xs text-gray-500 mb-1 ml-1">
            {ellipsify(message.sender, 6)}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            message.isOwn
              ? 'bg-primary text-primary-content rounded-br-md'
              : 'bg-base-300 text-base-content rounded-bl-md'
          }`}
        >
          {renderContent()}

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              message.isOwn ? 'text-primary-content/60' : 'text-gray-500'
            }`}
          >
            {formatTime(message.timestamp)}
            {message.isDecrypted && (
              <span className="ml-1" title="Decrypted">
                🔓
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
