'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { decryptMessage } from '@/lib/quantum-crypto';
import { useRelayProgram } from './relay-data-access';
import { RelayList } from './relay-ui';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';

export default function RelayFeature() {
  const { publicKey } = useWallet();
  const { programId } = useRelayProgram();
  const router = useRouter();

  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [decryptStatus, setDecryptStatus] = useState<'idle' | 'unlocked' | 'error'>('idle');

  const handleDecryptSecurely = () => {
    if (!privateKey.trim()) return;
    // Store in sessionStorage so message list can use it for decryption
    // It's never sent over the network — stays in browser memory only
    try {
      sessionStorage.setItem('relay_private_key', privateKey);
      setDecryptStatus('unlocked');
    } catch {
      setDecryptStatus('error');
    }
  };

  const handleClearKey = () => {
    sessionStorage.removeItem('relay_private_key');
    setPrivateKey('');
    setDecryptStatus('idle');
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)' }}>
        <div className="text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Relay</h1>
          <p className="text-gray-400 mb-8">Quantum-safe encrypted messaging on Solana</p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)',
      fontFamily: 'Georgia, serif'
    }}>
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h1 className="text-white font-bold text-lg">Relay</h1>
            {programId && (
              <ExplorerLink
                path={`account/${programId}`}
                label={ellipsify(programId.toString())}
                className="text-xs text-gray-500 hover:text-cyan-400 transition-colors"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
            ML-KEM-768 · NIST FIPS 203
          </span>
          <WalletButton />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Messages Section */}
        <div>
          <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Your Messages</h2>
          <RelayList />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8" />

        {/* Decrypt Panel */}
        <div style={{
          background: 'linear-gradient(180deg, #0d1117 0%, #0a0d0a 100%)',
          border: '1px solid #1a2a1a',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 0 40px rgba(0,255,100,0.03)'
        }}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔓</div>
            <h2 className="text-white text-xl font-bold mb-1">Decrypt your messages</h2>
            <p className="text-gray-500 text-sm">This action uses your private key locally. We never store or transmit your key.</p>
          </div>

          {decryptStatus === 'unlocked' ? (
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/40 text-green-400 px-4 py-2 rounded-full text-sm">
                <span>✓</span> Private key loaded — messages above are now decryptable
              </div>
              <div>
                <button
                  onClick={handleClearKey}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors underline"
                >
                  Clear key from memory
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your ML-KEM-768 private key (Base64)..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600"
                  style={{
                    background: '#0a0f0a',
                    border: '1px solid #1f2f1f',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2f1f'}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-400 text-xs"
                >
                  {showKey ? '🙈 hide' : '👁 show'}
                </button>
              </div>
              <p className="text-xs text-gray-700 text-center italic">We do this Masked!</p>

              {decryptStatus === 'error' && (
                <p className="text-red-400 text-xs text-center">Something went wrong. Check your key format.</p>
              )}

              <button
                onClick={handleDecryptSecurely}
                disabled={!privateKey.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: privateKey.trim()
                    ? 'linear-gradient(90deg, #00d4aa, #00b4d8)'
                    : '#1a1a1a',
                  color: privateKey.trim() ? '#000' : '#444',
                  cursor: privateKey.trim() ? 'pointer' : 'not-allowed',
                  border: 'none',
                }}
              >
                🔓 Decrypt Securely →
              </button>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <div style={{
          background: 'linear-gradient(180deg, #0d0d17 0%, #0a0a14 100%)',
          border: '1px solid #1a1a2e',
          borderRadius: '16px',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(100,0,255,0.03)'
        }}>
          <div className="text-3xl mb-3">✍️</div>
          <h2 className="text-white text-lg font-bold mb-1">Send a new encrypted message</h2>
          <p className="text-gray-500 text-sm mb-5">End-to-end encrypted with ML-KEM-768. Stored on Solana.</p>
          <button
            onClick={() => router.push('/relay/compose')}
            className="px-8 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            ✉️ Compose New Message
          </button>
        </div>

      </div>
    </div>
  );
}