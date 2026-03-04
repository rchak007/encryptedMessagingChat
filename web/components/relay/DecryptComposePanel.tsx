'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DecryptComposePanel() {
  const router = useRouter();
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleDecrypt = () => {
    if (!privateKey.trim()) return;
    sessionStorage.setItem('relay_private_key', privateKey);
    setUnlocked(true);
  };

  const handleClear = () => {
    sessionStorage.removeItem('relay_private_key');
    setPrivateKey('');
    setUnlocked(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 mb-6 space-y-4 px-4">

      {/* Decrypt Panel */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #0a0d0a 100%)',
        border: '1px solid #1a2a1a',
        borderRadius: '16px',
        padding: '32px',
      }}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔓</div>
          <h2 className="text-white text-xl font-bold mb-1">Decrypt your messages</h2>
          <p className="text-gray-500 text-sm">This action uses your private key locally. We never store or transmit your key.</p>
        </div>

        {unlocked ? (
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/40 text-green-400 px-4 py-2 rounded-full text-sm">
              ✓ Private key loaded
            </div>
            <div>
              <button onClick={handleClear} className="text-xs text-gray-600 hover:text-red-400 transition-colors underline">
                Clear key from memory
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Enter Private Key or Password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600"
                style={{
                  background: '#0a0f0a',
                  border: '1px solid #1f2f1f',
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 text-xs"
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center italic">We do this Masked!</p>
            <button
              onClick={handleDecrypt}
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
              Decrypt Securely →
            </button>
          </div>
        )}
      </div>

      {/* Compose Button */}
      <button
        onClick={() => router.push('/relay/compose')}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        ✉️ Compose New Message
      </button>

    </div>
  );
}
