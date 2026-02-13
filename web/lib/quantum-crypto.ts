/**
 * Quantum-Safe Encryption Utilities
 * Using ML-KEM-768 for key encapsulation + AES-256-GCM for symmetric encryption
 */

import { ml_kem768 } from '@noble/post-quantum/ml-kem';

// Utility functions
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Encrypt a message for a recipient using their ML-KEM public key
 * @param message - The message to encrypt (string)
 * @param recipientPublicKeyBase64 - Recipient's ML-KEM-768 public key (base64)
 * @returns Object with ciphertext and nonce (both base64 encoded)
 */
export async function encryptMessage(
  message: string,
  recipientPublicKeyBase64: string
): Promise<{ ciphertext: string; nonce: string }> {
  try {
    // 1. Decode recipient's public key
    const recipientPublicKey = fromBase64(recipientPublicKeyBase64);
    
    // 2. Use ML-KEM to encapsulate a shared secret
    const { cipherText: kemCiphertext, sharedSecret } = ml_kem768.encapsulate(recipientPublicKey);
    
    // 3. Use the shared secret to derive AES-GCM key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // 4. Generate random IV/nonce for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 5. Encrypt the message with AES-GCM
    const messageBytes = new TextEncoder().encode(message);
    const encryptedMessage = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      messageBytes
    );
    
    // 6. Combine KEM ciphertext + IV + encrypted message
    const combined = new Uint8Array(
      kemCiphertext.length + iv.length + encryptedMessage.byteLength
    );
    combined.set(kemCiphertext, 0);
    combined.set(iv, kemCiphertext.length);
    combined.set(new Uint8Array(encryptedMessage), kemCiphertext.length + iv.length);
    
    // 7. Return as base64
    return {
      ciphertext: toBase64(combined),
      nonce: toBase64(iv) // Store IV separately for convenience
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using your ML-KEM private key
 * @param ciphertext - The encrypted message (base64)
 * @param privateKeyBase64 - Your ML-KEM-768 private key (base64)
 * @returns Decrypted message string
 */
export async function decryptMessage(
  ciphertext: string,
  privateKeyBase64: string
): Promise<string> {
  try {
    // 1. Decode private key and ciphertext
    const privateKey = fromBase64(privateKeyBase64);
    const combined = fromBase64(ciphertext);
    
    // 2. Extract components (KEM ciphertext is 1088 bytes for ML-KEM-768, IV is 12 bytes)
    const kemCiphertextLength = 1088;
    const ivLength = 12;
    
    const kemCiphertext = combined.slice(0, kemCiphertextLength);
    const iv = combined.slice(kemCiphertextLength, kemCiphertextLength + ivLength);
    const encryptedMessage = combined.slice(kemCiphertextLength + ivLength);
    
    // 3. Use ML-KEM to decapsulate and get shared secret
    const sharedSecret = ml_kem768.decapsulate(kemCiphertext, privateKey);
    
    // 4. Import shared secret as AES-GCM key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // 5. Decrypt the message
    const decryptedBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedMessage
    );
    
    // 6. Convert back to string
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Generate wrapped keys for group messaging
 * Encrypts a group key for each member using their public key
 */
export async function generateWrappedKeys(
  groupKey: Uint8Array,
  memberPublicKeys: { member: string; publicKey: string }[]
): Promise<Array<{ member: string; wrappedKey: Uint8Array }>> {
  const wrappedKeys = [];
  
  for (const { member, publicKey } of memberPublicKeys) {
    // Encrypt the group key for this member
    const { ciphertext } = await encryptMessage(
      toBase64(groupKey),
      publicKey
    );
    
    wrappedKeys.push({
      member,
      wrappedKey: fromBase64(ciphertext)
    });
  }
  
  return wrappedKeys;
}

/**
 * Create a random symmetric key for group encryption
 */
export function generateGroupKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
}

/**
 * Encrypt message with a symmetric group key
 */
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
  
  return {
    ciphertext: new Uint8Array(ciphertext),
    nonce
  };
}

/**
 * Decrypt message with a symmetric group key
 */
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