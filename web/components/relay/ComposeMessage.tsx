'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useRelayProgram } from './relay-data-access';
import { encryptMessage } from '@/lib/quantum-crypto';
import { WalletButton } from '../solana/solana-provider';

interface Recipient {
  wallet: string;
  mlKemPublicKey: string | null;
  status: 'checking' | 'registered' | 'not_registered' | 'invalid';
}

export default function ComposeMessage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { program, programId } = useRelayProgram();

  const [walletInput, setWalletInput] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [messageText, setMessageText] = useState('');
  const [myPrivateKey, setMyPrivateKey] = useState('');
  const [myPublicKey, setMyPublicKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [title, setTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill private key from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('relay_private_key');
    if (stored) setMyPrivateKey(stored);
  }, []);

  const lookupRegistry = async (walletAddress: string): Promise<string | null> => {
    if (!program || !programId) {
      console.log('Program not ready yet');
      return null;
    }
    try {
      const ownerPubkey = new PublicKey(walletAddress);
      const [registryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('registry'), ownerPubkey.toBuffer()],
        programId
      );
      console.log('Looking up registry PDA:', registryPda.toString());
      const reg = await program.account.registry.fetch(registryPda);
      console.log('Registry found:', reg);
      // Rust: pq_public_key → Anchor camelCase: pqPublicKey
      // return (reg.pqPublicKey as string) ?? null;
      return reg.pqPublicKey ? Buffer.from(reg.pqPublicKey as number[]).toString('base64') : null;
    } catch (e) {
      console.log('Registry lookup failed:', e);
      return null;
    }
  };

  const handleAddRecipient = async () => {
    const addr = walletInput.trim();
    if (!addr) return;

    try {
      new PublicKey(addr);
    } catch {
      setRecipients(prev => [...prev, { wallet: addr, mlKemPublicKey: null, status: 'invalid' }]);
      setWalletInput('');
      return;
    }

    if (recipients.find(r => r.wallet === addr)) {
      setWalletInput('');
      return;
    }

    setRecipients(prev => [...prev, { wallet: addr, mlKemPublicKey: null, status: 'checking' }]);
    setWalletInput('');

    const key = await lookupRegistry(addr);
    setRecipients(prev =>
      prev.map(r =>
        r.wallet === addr
          ? { ...r, mlKemPublicKey: key, status: key ? 'registered' : 'not_registered' }
          : r
      )
    );
  };

  const removeRecipient = (wallet: string) => {
    setRecipients(prev => prev.filter(r => r.wallet !== wallet));
  };

  const canSend =
    recipients.length > 0 &&
    recipients.every(r => r.status === 'registered') &&
    messageText.trim() !== '' &&
    myPrivateKey.trim() !== '' &&
    myPublicKey.trim() !== '' &&
    title.trim() !== '' &&
    !isSending;

  const handleSend = async () => {
    if (!publicKey || !canSend || !program || !programId) return;
    setIsSending(true);
    setErrorMsg('');

    try {
      for (const r of recipients) {
        if (!r.mlKemPublicKey) continue;

        const { ciphertext, nonce } = await encryptMessage(messageText, r.mlKemPublicKey);
        const encryptedPayload = JSON.stringify({
          ciphertext,
          nonce,
          senderPublicKey: myPublicKey,
        });

        const [relayAddress] = await PublicKey.findProgramAddress(
          [Buffer.from('relay'), Buffer.from(title), publicKey.toBuffer()],
          programId
        );

        await program.methods
          .create(title, encryptedPayload, r.wallet, true)
          .accounts({ relay: relayAddress })
          .rpc();
      }

      setSendStatus('success');
      setTimeout(() => router.push('/'), 2000);
    } catch (e: any) {
      console.error('Send failed:', e);
      setErrorMsg(e?.message || 'Failed to send message');
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🔐</div>
          <p className="text-gray-400 mb-6">Connect your wallet to compose</p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-bold">Compose new message</h1>
        <div className="ml-auto">
          <span className="text-xs bg-purple-900/40 border border-purple-700/30 text-purple-300 px-3 py-1 rounded-full">
            🔐 {publicKey.toString().slice(0, 6)}..{publicKey.toString().slice(-4)}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div style={{ background: '#0d0d17', border: '1px solid #1a1a2e', borderRadius: '16px', overflow: 'hidden' }}>

          {/* To field */}
          <div style={{ borderBottom: '1px solid #1a1a2e', padding: '20px 24px' }}>
            <label className="text-gray-500 text-xs uppercase tracking-widest block mb-3">
              To (Solana wallet address)
            </label>
            <div className="flex gap-2">
              <input type="text" placeholder="Paste wallet address here..."
                value={walletInput} onChange={(e) => setWalletInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600"
                style={{ background: '#0a0a14', border: '1px solid #1f1f3a', outline: 'none', fontFamily: 'monospace' }} />
              <button onClick={handleAddRecipient}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Add
              </button>
            </div>
          </div>

          {/* Recipients */}
          {recipients.length > 0 && (
            <div style={{ borderBottom: '1px solid #1a1a2e', padding: '16px 24px' }}>
              <label className="text-gray-500 text-xs uppercase tracking-widest block mb-3">Recipients</label>
              <div className="space-y-2">
                {recipients.map((r) => (
                  <div key={r.wallet} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: '#0a0a14', border: '1px solid #1a1a2e' }}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={r.status === 'registered'} readOnly style={{ accentColor: '#7c3aed' }} />
                      <span className="text-white text-xs font-mono">{r.wallet.slice(0, 6)}..{r.wallet.slice(-4)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'checking' && <span className="text-xs text-gray-500 animate-pulse">Checking...</span>}
                      {r.status === 'registered' && <span className="text-xs text-green-400">✓ Registered</span>}
                      {r.status === 'not_registered' && (
                        <div className="text-right">
                          <span className="text-xs text-yellow-500">⚠ Not registered</span>
                          <p className="text-xs text-gray-600">Recipient must register to receive encrypted messages.</p>
                        </div>
                      )}
                      {r.status === 'invalid' && <span className="text-xs text-red-400">✗ Invalid address</span>}
                      <button onClick={() => removeRecipient(r.wallet)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-xs ml-2">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ borderBottom: '1px solid #1a1a2e', padding: '16px 24px' }}>
            <label className="text-gray-500 text-xs uppercase tracking-widest block mb-2">Message Title / ID</label>
            <input type="text" placeholder="Unique title for this message..."
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600"
              style={{ background: '#0a0a14', border: '1px solid #1f1f3a', outline: 'none' }} />
          </div>

          {/* Message */}
          <div style={{ borderBottom: '1px solid #1a1a2e', padding: '16px 24px' }}>
            <label className="text-gray-500 text-xs uppercase tracking-widest block mb-2">Message</label>
            <textarea placeholder="Type your message here..." value={messageText}
              onChange={(e) => setMessageText(e.target.value)} rows={5}
              className="w-full px-3 py-3 rounded-lg text-sm text-white placeholder-gray-600 resize-none"
              style={{ background: '#0a0a14', border: '1px solid #1f1f3a', outline: 'none' }} />
            <p className="text-xs text-gray-600 mt-1">🔒 End-to-end encrypted. Encryption happens locally.</p>
          </div>

          {/* Keys */}
          <div style={{ borderBottom: '1px solid #1a1a2e', padding: '16px 24px' }}>
            <label className="text-gray-500 text-xs uppercase tracking-widest block mb-3">Your Quantum-Safe Keys</label>
            <div className="space-y-2">
              <div className="relative">
                <input type={showPrivateKey ? 'text' : 'password'}
                  placeholder="Your ML-KEM-768 private key (Base64) — never stored"
                  value={myPrivateKey} onChange={(e) => setMyPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-gray-600"
                  style={{ background: '#0a0a14', border: '1px solid #1f1f3a', outline: 'none', fontFamily: 'monospace' }} />
                <button onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-3 top-2 text-gray-600 hover:text-gray-400 text-xs">
                  {showPrivateKey ? '🙈' : '👁'}
                </button>
              </div>
              <input type="text" placeholder="Your ML-KEM-768 public key (Base64)"
                value={myPublicKey} onChange={(e) => setMyPublicKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-gray-600"
                style={{ background: '#0a0a14', border: '1px solid #1f1f3a', outline: 'none', fontFamily: 'monospace' }} />
            </div>
          </div>

          {/* Send */}
          <div style={{ padding: '20px 24px' }}>
            {sendStatus === 'success' ? (
              <div className="text-center py-2">
                <span className="text-green-400 font-semibold">✓ Message sent! Redirecting...</span>
              </div>
            ) : (
              <>
                {sendStatus === 'error' && (
                  <p className="text-red-400 text-xs mb-3 text-center">{errorMsg}</p>
                )}
                <button onClick={handleSend} disabled={!canSend}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: canSend ? 'linear-gradient(90deg, #7c3aed, #4f46e5)' : '#1a1a2e',
                    color: canSend ? '#fff' : '#444',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    border: 'none',
                  }}>
                  {isSending ? '⏳ Encrypting & sending...' : '🔐 Encrypt & Send Message'}
                </button>
                <p className="text-xs text-gray-700 text-center mt-2">🔒 End-to-end encrypted. Encryption happens locally.</p>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
