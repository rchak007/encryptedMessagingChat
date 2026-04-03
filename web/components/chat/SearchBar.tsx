'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from './types';

interface SearchBarProps {
  messages: Message[];
  onSearchResults: (results: Message[], query: string) => void;
  onNavigateToMessage: (messageId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({
  messages,
  onSearchResults,
  onNavigateToMessage,
  isOpen,
  onClose,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search through decrypted messages
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      onSearchResults([], '');
      return;
    }

    const searchResults = messages.filter(
      (msg) =>
        msg.isDecrypted &&
        msg.content.toLowerCase().includes(query.toLowerCase())
    );

    setResults(searchResults);
    setCurrentIndex(0);
    onSearchResults(searchResults, query);

    // Navigate to first result
    if (searchResults.length > 0) {
      onNavigateToMessage(searchResults[0].id);
    }
  }, [query, messages]);

  const handlePrevious = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    setCurrentIndex(newIndex);
    onNavigateToMessage(results[newIndex].id);
  };

  const handleNext = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onNavigateToMessage(results[newIndex].id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onSearchResults([], '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-base-200 border-b border-gray-700 p-3 shadow-lg">
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search in conversation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 pl-10 rounded-lg bg-base-300 text-white placeholder-gray-500 border border-gray-600 focus:border-primary focus:outline-none text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Results count */}
        {query && (
          <div className="text-sm text-gray-400 whitespace-nowrap">
            {results.length > 0 ? (
              <span>
                {currentIndex + 1} of {results.length}
              </span>
            ) : (
              <span>No results</span>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        {results.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={handlePrevious}
              className="btn btn-sm btn-ghost"
              title="Previous (Shift+Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="btn btn-sm btn-ghost"
              title="Next (Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="btn btn-sm btn-ghost"
          title="Close (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search hint */}
      <div className="text-xs text-gray-500 mt-2">
        Only searches decrypted messages. Press Enter to navigate, Esc to close.
      </div>
    </div>
  );
}
