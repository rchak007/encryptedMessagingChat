'use client';

import React, { useState } from 'react';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';

// Utility function to convert Uint8Array to base64
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

// Utility function to convert base64 to Uint8Array
function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export default function QuantumKeyPairGenerator() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateKeyPair = async () => {
    setIsGenerating(true);
    
    try {
      // Generate ML-KEM-768 key pair
      const keyPair = ml_kem768.keygen();
      
      // Convert to base64 for display and storage
      setPublicKey(toBase64(keyPair.publicKey));
      setPrivateKey(toBase64(keyPair.secretKey));
      
      console.log('Quantum-safe key pair generated!');
      console.log('Public key length:', keyPair.publicKey.length, 'bytes');
      console.log('Secret key length:', keyPair.secretKey.length, 'bytes');
    } catch (error) {
      console.error('Error generating key pair:', error);
      alert('Failed to generate key pair. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToLocalStorage = () => {
    if (publicKey && privateKey) {
      localStorage.setItem('pq_public_key', publicKey);
      localStorage.setItem('pq_private_key', privateKey);
      alert('Keys saved to local storage!');
    }
  };

  const loadFromLocalStorage = () => {
    const pubKey = localStorage.getItem('pq_public_key');
    const privKey = localStorage.getItem('pq_private_key');
    
    if (pubKey && privKey) {
      setPublicKey(pubKey);
      setPrivateKey(privKey);
      alert('Keys loaded from local storage!');
    } else {
      alert('No keys found in local storage.');
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  };

  return (
    <div className="card bg-base-200 shadow-xl p-6 my-4">
      <h2 className="card-title text-2xl mb-4">🔐 Quantum-Safe Key Generator</h2>
      <p className="text-sm mb-4 opacity-70">
        Using ML-KEM-768 (NIST FIPS 203) - Post-Quantum Cryptography
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={generateKeyPair} 
          className="btn btn-primary"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="loading loading-spinner"></span>
          ) : (
            '🎲 Generate New Keys'
          )}
        </button>
        
        <button 
          onClick={saveToLocalStorage} 
          className="btn btn-secondary"
          disabled={!publicKey || !privateKey}
        >
          💾 Save to Local Storage
        </button>
        
        <button 
          onClick={loadFromLocalStorage} 
          className="btn btn-accent"
        >
          📂 Load from Local Storage
        </button>
      </div>

      {publicKey && privateKey && (
        <div className="space-y-4">
          {/* Public Key */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Public Key (Share this)</span>
              <span className="label-text-alt">{fromBase64(publicKey).length} bytes</span>
            </label>
            <div className="flex gap-2">
              <textarea
                className="textarea textarea-bordered font-mono text-xs flex-1"
                rows={4}
                readOnly
                value={publicKey}
              />
              <button 
                onClick={() => copyToClipboard(publicKey, 'Public Key')}
                className="btn btn-square btn-sm"
              >
                📋
              </button>
            </div>
          </div>

          {/* Private Key */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-error">Private Key (Keep Secret!)</span>
              <span className="label-text-alt">{fromBase64(privateKey).length} bytes</span>
            </label>
            <div className="flex gap-2">
              <textarea
                className="textarea textarea-bordered textarea-error font-mono text-xs flex-1"
                rows={6}
                readOnly
                value={privateKey}
              />
              <button 
                onClick={() => copyToClipboard(privateKey, 'Private Key')}
                className="btn btn-square btn-sm btn-error"
              >
                📋
              </button>
            </div>
          </div>

          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Never share your private key! Store it securely offline.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export utility functions for use in other components
export { toBase64, fromBase64 };