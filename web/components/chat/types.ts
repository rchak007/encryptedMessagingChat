/**
 * Chat Types
 * Type definitions for the chat UI components
 */

import { PublicKey } from '@solana/web3.js';

// Contact/User representation
export interface Contact {
  wallet: string;
  publicKey: PublicKey;
  mlKemPublicKey: string | null;
  displayName?: string;
  isRegistered: boolean;
}

// Single message in a conversation
export interface Message {
  id: string;
  msgId: number;
  sender: string;
  senderPublicKey: PublicKey;
  content: string;
  encryptedContent: {
    ciphertext: Uint8Array;
    nonce: Uint8Array;
  } | null;
  timestamp: number;
  isDecrypted: boolean;
  isOwn: boolean;
  decryptionError?: string;
  keyVersion?: number;
}

// Direct (1-to-1) conversation
export interface DirectConversation {
  type: 'direct';
  id: string;
  participant: Contact;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

// Group conversation
export interface GroupConversation {
  type: 'group';
  id: string;
  groupId: string;
  groupPubkey: PublicKey;
  name: string;
  members: Contact[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  keyVersion: number;
  createdAt: number;
}

// Union type for any conversation
export type Conversation = DirectConversation | GroupConversation;

// Chat application state
export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
}

// Search state
export interface SearchState {
  query: string;
  results: Message[];
  isSearching: boolean;
  highlightedMessageId: string | null;
}

// Decryption state
export interface DecryptionState {
  privateKey: string | null;
  isUnlocked: boolean;
  decryptedMessages: Map<string, string>;
}
