'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  isEncrypted?: boolean;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  isEncrypted = true,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 bg-base-200 p-4">
      {/* Encryption indicator */}
      {isEncrypted && (
        <div className="flex items-center gap-1 text-xs text-green-500 mb-2">
          <span>🔒</span>
          <span>End-to-end encrypted with ML-KEM-768</span>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-3 rounded-xl bg-base-300 text-white placeholder-gray-500 border border-gray-600 focus:border-primary focus:outline-none resize-none text-sm"
            style={{ minHeight: '48px', maxHeight: '150px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          className={`p-3 rounded-xl transition-all ${
            message.trim() && !disabled && !isSending
              ? 'bg-primary text-primary-content hover:bg-primary-focus'
              : 'bg-base-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
