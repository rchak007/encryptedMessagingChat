import { render, screen, fireEvent } from '@testing-library/react';
import ChatLayout from '../ChatLayout';
import { Conversation } from '../types';
import { PublicKey } from '@solana/web3.js';

const SAMPLE_PUBKEY = new PublicKey('11111111111111111111111111111111');

const conversation: Conversation = {
  type: 'direct',
  id: 'conv-1',
  participant: {
    wallet: 'wallet1',
    publicKey: SAMPLE_PUBKEY,
    mlKemPublicKey: null,
    displayName: 'Alice',
    isRegistered: true,
  },
  messages: [
    {
      id: '1',
      msgId: 1,
      sender: 'Alice',
      senderPublicKey: SAMPLE_PUBKEY,
      content: 'Hello there',
      encryptedContent: null,
      timestamp: 1_700_000_000,
      isDecrypted: true,
      isOwn: false,
    },
  ],
  lastMessage: undefined,
  unreadCount: 0,
};

describe('ChatLayout', () => {
  const renderChat = () =>
    render(
      <ChatLayout
        conversations={[conversation]}
        isLoading={false}
        isDecryptionUnlocked={true}
        onUnlockDecryption={jest.fn()}
        onSendMessage={jest.fn().mockResolvedValue(undefined)}
        onNewConversation={jest.fn()}
      />
    );

  it('shows placeholder before a conversation is selected', () => {
    renderChat();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
  });

  it('renders messages after selecting a conversation', () => {
    renderChat();
    fireEvent.click(screen.getByText('Alice'));
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });
});
