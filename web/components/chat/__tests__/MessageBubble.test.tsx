import { render, screen } from '@testing-library/react';
import MessageBubble from '../MessageBubble';
import { Message } from '../types';
import { PublicKey } from '@solana/web3.js';

const SAMPLE_PUBKEY = new PublicKey('11111111111111111111111111111111');

const baseMessage: Message = {
  id: '1',
  msgId: 1,
  sender: 'Alice',
  senderPublicKey: SAMPLE_PUBKEY,
  content: 'Hello world',
  encryptedContent: null,
  timestamp: 1_700_000_000,
  isDecrypted: true,
  isOwn: false,
};

describe('MessageBubble', () => {
  it('renders decrypted content', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows encrypted placeholder when not decrypted', () => {
    const encrypted: Message = { ...baseMessage, isDecrypted: false };
    render(<MessageBubble message={encrypted} />);
    expect(screen.getByText('Encrypted message')).toBeInTheDocument();
  });

  it('highlights search matches', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} searchQuery="Hello" />
    );
    const mark = container.querySelector('mark');
    expect(mark?.textContent).toBe('Hello');
  });
});
