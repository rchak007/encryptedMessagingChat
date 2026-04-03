'use client';

import { useState } from 'react';
import ChatLayout from '@/components/chat/ChatLayout';
import { Conversation, Message } from '@/components/chat/types';
import { PublicKey } from '@solana/web3.js';

// Mock data for development/demo
const MOCK_PUBKEY = new PublicKey('11111111111111111111111111111111');

const createMockMessage = (
  id: string,
  content: string,
  isOwn: boolean,
  isDecrypted: boolean,
  timestamp: number
): Message => ({
  id,
  msgId: parseInt(id),
  sender: isOwn ? 'You' : 'Demo User',
  senderPublicKey: MOCK_PUBKEY,
  content,
  encryptedContent: null,
  timestamp,
  isDecrypted,
  isOwn,
});

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    type: 'direct',
    id: 'conv-1',
    participant: {
      wallet: '7Zwj13Kdn7BN7Pv5DFbDViuRQxsf8P4L4Uj8JEU74hkK',
      publicKey: MOCK_PUBKEY,
      mlKemPublicKey: 'mock-key-1',
      displayName: 'Alice',
      isRegistered: true,
    },
    messages: [
      createMockMessage('1', 'Hey! Have you tried the new quantum encryption?', false, true, Date.now() / 1000 - 3600),
      createMockMessage('2', 'Yes! ML-KEM-768 is amazing. Post-quantum secure!', true, true, Date.now() / 1000 - 3500),
      createMockMessage('3', 'I love that messages are encrypted before they hit the blockchain', false, true, Date.now() / 1000 - 3400),
      createMockMessage('4', 'Exactly. Not even validators can read our messages.', true, true, Date.now() / 1000 - 3300),
      createMockMessage('5', '🔒 This is the future of secure messaging', false, true, Date.now() / 1000 - 3200),
    ],
    lastMessage: undefined,
    unreadCount: 0,
  },
  {
    type: 'direct',
    id: 'conv-2',
    participant: {
      wallet: '9ABC...DEF1',
      publicKey: MOCK_PUBKEY,
      mlKemPublicKey: 'mock-key-2',
      displayName: 'Bob',
      isRegistered: true,
    },
    messages: [
      createMockMessage('10', 'When is the group meeting?', false, true, Date.now() / 1000 - 7200),
      createMockMessage('11', 'Tomorrow at 3pm UTC', true, true, Date.now() / 1000 - 7100),
      createMockMessage('12', '🔒 Encrypted message...', false, false, Date.now() / 1000 - 100),
    ],
    lastMessage: undefined,
    unreadCount: 1,
  },
  {
    type: 'group',
    id: 'conv-3',
    groupId: 'group-123',
    groupPubkey: MOCK_PUBKEY,
    name: 'Relay Dev Team',
    members: [
      { wallet: 'wallet1', publicKey: MOCK_PUBKEY, mlKemPublicKey: null, displayName: 'Alice', isRegistered: true },
      { wallet: 'wallet2', publicKey: MOCK_PUBKEY, mlKemPublicKey: null, displayName: 'Bob', isRegistered: true },
      { wallet: 'wallet3', publicKey: MOCK_PUBKEY, mlKemPublicKey: null, displayName: 'Charlie', isRegistered: true },
    ],
    messages: [
      createMockMessage('20', 'Welcome to the Relay dev team group!', false, true, Date.now() / 1000 - 86400),
      createMockMessage('21', 'Thanks for adding me!', true, true, Date.now() / 1000 - 86300),
      createMockMessage('22', 'Let\'s build something amazing', false, true, Date.now() / 1000 - 86200),
      createMockMessage('23', 'The quantum encryption is looking solid', false, true, Date.now() / 1000 - 50000),
      createMockMessage('24', 'Agreed. Ready for post-quantum threats!', true, true, Date.now() / 1000 - 49000),
    ],
    lastMessage: undefined,
    unreadCount: 2,
    keyVersion: 1,
    createdAt: Date.now() / 1000 - 86400,
  },
  {
    type: 'group',
    id: 'conv-4',
    groupId: 'group-456',
    groupPubkey: MOCK_PUBKEY,
    name: 'Solana Builders',
    members: [
      { wallet: 'wallet4', publicKey: MOCK_PUBKEY, mlKemPublicKey: null, displayName: 'Dev1', isRegistered: true },
      { wallet: 'wallet5', publicKey: MOCK_PUBKEY, mlKemPublicKey: null, displayName: 'Dev2', isRegistered: true },
    ],
    messages: [
      createMockMessage('30', 'Anyone working on Anchor programs?', false, true, Date.now() / 1000 - 200000),
      createMockMessage('31', 'Yes! Check out the relay contract', true, true, Date.now() / 1000 - 199000),
    ],
    lastMessage: undefined,
    unreadCount: 0,
    keyVersion: 1,
    createdAt: Date.now() / 1000 - 200000,
  },
];

// Set lastMessage for each conversation
MOCK_CONVERSATIONS.forEach((conv) => {
  if (conv.messages.length > 0) {
    conv.lastMessage = conv.messages[conv.messages.length - 1];
  }
});

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [isDecryptionUnlocked, setIsDecryptionUnlocked] = useState(true);

  const handleSendMessage = async (conversationId: string, content: string) => {
    // Simulate sending a message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      msgId: Date.now(),
      sender: 'You',
      senderPublicKey: MOCK_PUBKEY,
      content,
      encryptedContent: null,
      timestamp: Date.now() / 1000,
      isDecrypted: true,
      isOwn: true,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: newMessage,
            }
          : conv
      )
    );

    // Simulate a reply after 1 second
    setTimeout(() => {
      const replyMessage: Message = {
        id: `msg-${Date.now()}-reply`,
        msgId: Date.now(),
        sender: 'Demo Bot',
        senderPublicKey: MOCK_PUBKEY,
        content: `Got your message: "${content.slice(0, 30)}${content.length > 30 ? '...' : ''}"`,
        encryptedContent: null,
        timestamp: Date.now() / 1000,
        isDecrypted: true,
        isOwn: false,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, replyMessage],
                lastMessage: replyMessage,
              }
            : conv
        )
      );
    }, 1000);
  };

  const handleNewConversation = () => {
    alert('New conversation modal would open here!\n\nFeatures:\n- Enter wallet address for 1:1 chat\n- Or create a group with multiple members');
  };

  const handleUnlockDecryption = () => {
    setIsDecryptionUnlocked(!isDecryptionUnlocked);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Dev mode banner */}
      <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-500 text-sm">
          <span>🛠️</span>
          <span className="font-medium">Development Mode</span>
          <span className="text-yellow-600">- Using mock data. No blockchain interaction.</span>
        </div>
      </div>

      {/* Chat layout */}
      <ChatLayout
        conversations={conversations}
        isLoading={false}
        isDecryptionUnlocked={isDecryptionUnlocked}
        onUnlockDecryption={handleUnlockDecryption}
        onSendMessage={handleSendMessage}
        onNewConversation={handleNewConversation}
      />

      {/* Instructions */}
      <div className="mt-4 p-4 bg-base-200 rounded-lg text-sm text-gray-400">
        <h3 className="font-medium text-white mb-2">Demo Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Click a conversation to view messages</li>
          <li>Send messages (auto-reply enabled)</li>
          <li>Use the search icon to search within conversations</li>
          <li>Toggle encryption lock to simulate decryption state</li>
          <li>Filter by All / 1:1 / Groups in sidebar</li>
        </ul>
      </div>
    </div>
  );
}
