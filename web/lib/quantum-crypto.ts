/**
 * Quantum-Safe Encryption Utilities
 * Using ML-KEM-768 for key encapsulation + AES-256-GCM for symmetric encryption
 */

// FIX: Import from package root, not subpath
// import { ml_kem768 } from '@noble/post-quantum';
// import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';

// Utility functions
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Encrypt a message for a recipient using their ML-KEM public key
 */
export async function encryptMessage(
  message: string,
  recipientPublicKeyBase64: string
): Promise<{ ciphertext: string; nonce: string }> {
  try {
    const recipientPublicKey = fromBase64(recipientPublicKeyBase64);
    const { cipherText: kemCiphertext, sharedSecret } = ml_kem768.encapsulate(recipientPublicKey);

    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const messageBytes = new TextEncoder().encode(message);
    const encryptedMessage = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      messageBytes
    );

    const combined = new Uint8Array(
      kemCiphertext.length + iv.length + encryptedMessage.byteLength
    );
    combined.set(kemCiphertext, 0);
    combined.set(iv, kemCiphertext.length);
    combined.set(new Uint8Array(encryptedMessage), kemCiphertext.length + iv.length);

    return {
      ciphertext: toBase64(combined),
      nonce: toBase64(iv),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using your ML-KEM private key
 */
export async function decryptMessage(
  ciphertext: string,
  privateKeyBase64: string
): Promise<string> {
  try {
    const privateKey = fromBase64(privateKeyBase64);
    const combined = fromBase64(ciphertext);

    const kemCiphertextLength = 1088;
    const ivLength = 12;

    const kemCiphertext = combined.slice(0, kemCiphertextLength);
    const iv = combined.slice(kemCiphertextLength, kemCiphertextLength + ivLength);
    const encryptedMessage = combined.slice(kemCiphertextLength + ivLength);

    const sharedSecret = ml_kem768.decapsulate(kemCiphertext, privateKey);

    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedMessage
    );

    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Generate wrapped keys for group messaging
 */
export async function generateWrappedKeys(
  groupKey: Uint8Array,
  memberPublicKeys: { member: string; publicKey: string }[]
): Promise<Array<{ member: string; wrappedKey: Uint8Array }>> {
  const wrappedKeys = [];
  for (const { member, publicKey } of memberPublicKeys) {
    const { ciphertext } = await encryptMessage(toBase64(groupKey), publicKey);
    wrappedKeys.push({ member, wrappedKey: fromBase64(ciphertext) });
  }
  return wrappedKeys;
}

export function generateGroupKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function encryptWithGroupKey(
  message: string,
  groupKey: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const aesKey = await crypto.subtle.importKey(
    'raw',
    groupKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const messageBytes = new TextEncoder().encode(message);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    messageBytes
  );
  return { ciphertext: new Uint8Array(ciphertext), nonce };
}

export async function decryptWithGroupKey(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  groupKey: Uint8Array
): Promise<string> {
  const aesKey = await crypto.subtle.importKey(
    'raw',
    groupKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const decryptedBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    ciphertext
  );
  return new TextDecoder().decode(decryptedBytes);
}