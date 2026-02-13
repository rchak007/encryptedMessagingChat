# Quantum-Safe Migration Guide

## Overview
This guide helps you migrate your Solana encrypted messaging app from NaCl to post-quantum cryptography using ML-KEM-768 (NIST FIPS 203).

## What Changed?

### Encryption Algorithm
- **Before**: NaCl (X25519 + XSalsa20-Poly1305)
- **After**: ML-KEM-768 + AES-256-GCM

### Key Sizes
| Component | NaCl | ML-KEM-768 |
|-----------|------|------------|
| Public Key | 32 bytes | 1,184 bytes |
| Private Key | 32 bytes | 2,400 bytes |
| Ciphertext Overhead | ~16 bytes | 1,088 bytes |

## Step-by-Step Migration

### 1. Update Dependencies

```bash
npm install @noble/post-quantum
```

### 2. Deploy New Smart Contract

1. Copy `quantum-relay-lib.rs` to replace your current `lib.rs`
2. Build and deploy to get a new program ID:
   ```bash
   anchor build
   anchor deploy
   ```
3. Update the `declare_id!()` in the Rust file with your new program ID
4. Update your frontend to use the new program ID

### 3. Update Frontend Components

#### Replace KeyPairGenerator.tsx
- Replace with `QuantumKeyPairGenerator.tsx`
- Import in your dashboard:
  ```typescript
  import QuantumKeyPairGenerator from '@/components/ui/QuantumKeyPairGenerator';
  ```

#### Add Encryption Utilities
- Copy `quantum-crypto.ts` to your utils/lib folder
- Use these functions for all encryption/decryption:
  ```typescript
  import { encryptMessage, decryptMessage } from '@/lib/quantum-crypto';
  ```

### 4. Update Registration Flow

**Before (NaCl):**
```typescript
import nacl from 'tweetnacl';
const keyPair = nacl.box.keyPair();
const publicKey = encodeBase64(keyPair.publicKey); // 32 bytes
```

**After (Quantum-Safe):**
```typescript
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { toBase64 } from '@/lib/quantum-crypto';

const keyPair = ml_kem768.keygen();
const publicKey = toBase64(keyPair.publicKey); // 1,184 bytes
```

### 5. Update Message Encryption

**Before (NaCl):**
```typescript
const nonce = randomBytes(24);
const encrypted = nacl.box(message, nonce, theirPublicKey, myPrivateKey);
```

**After (Quantum-Safe):**
```typescript
import { encryptMessage } from '@/lib/quantum-crypto';

const { ciphertext, nonce } = await encryptMessage(
  message,
  recipientPublicKeyBase64
);
```

### 6. Update Message Decryption

**Before (NaCl):**
```typescript
const decrypted = nacl.box.open(ciphertext, nonce, theirPublicKey, myPrivateKey);
```

**After (Quantum-Safe):**
```typescript
import { decryptMessage } from '@/lib/quantum-crypto';

const message = await decryptMessage(
  ciphertext,
  myPrivateKeyBase64
);
```

## On-Chain Storage Changes

### Registry Account
```rust
// OLD
pub struct Registry {
    pub owner: Pubkey,
    pub nacl_public_key: String,  // max 64 chars
    pub updated_at_slot: u64,
}

// NEW
pub struct Registry {
    pub owner: Pubkey,
    pub pq_public_key: String,    // max 2000 chars (base64 encoded)
    pub updated_at_slot: u64,
}
```

### Account Size Changes
- **Registry**: 8 + 32 + 4 + 64 + 8 = 116 bytes → 8 + 32 + 4 + 2000 + 8 = 2,052 bytes
- **GroupState**: Increased to accommodate larger wrapped keys
- **GroupMessage**: Increased MAX_CIPHERTEXT_BYTES to 2000

## Testing Your Migration

### 1. Test Key Generation
```typescript
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { toBase64, fromBase64 } from '@/lib/quantum-crypto';

// Generate keys
const alice = ml_kem768.keygen();
console.log('Public key length:', alice.publicKey.length); // Should be 1184
console.log('Secret key length:', alice.secretKey.length); // Should be 2400
```

### 2. Test Encryption/Decryption
```typescript
import { encryptMessage, decryptMessage } from '@/lib/quantum-crypto';

const message = "Hello Quantum World!";
const aliceKeys = ml_kem768.keygen();

// Encrypt
const encrypted = await encryptMessage(
  message,
  toBase64(aliceKeys.publicKey)
);

// Decrypt
const decrypted = await decryptMessage(
  encrypted.ciphertext,
  toBase64(aliceKeys.secretKey)
);

console.log(decrypted === message); // Should be true
```

### 3. Test On-Chain Registration
```typescript
// Register your quantum-safe public key
const keyPair = ml_kem768.keygen();
const publicKeyBase64 = toBase64(keyPair.publicKey);

await program.methods
  .register(publicKeyBase64)
  .accounts({
    registry: registryPDA,
    owner: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Important Notes

### Security Considerations
1. **Key Storage**: ML-KEM private keys are larger (2,400 bytes). Store securely in localStorage or encrypted storage.
2. **Backup Keys**: Users should backup their private keys - losing them means losing access to all messages.
3. **Migration Window**: This is a clean break - old NaCl messages cannot be decrypted with new quantum keys.

### Performance
- **Key Generation**: ~0.3ms per operation
- **Encapsulation**: ~0.3ms per operation
- **Decapsulation**: ~0.25ms per operation
- **Overall**: Performance is excellent for a messaging app

### Compatibility
- **Browser Support**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile**: Works in React Native with polyfills
- **Node.js**: Full support

## Deployment Checklist

- [ ] Install `@noble/post-quantum` dependency
- [ ] Copy updated Rust contract (`quantum-relay-lib.rs`)
- [ ] Build and deploy new program
- [ ] Update program ID in frontend
- [ ] Replace KeyPairGenerator component
- [ ] Add quantum-crypto utilities
- [ ] Update all encryption/decryption calls
- [ ] Update wallet registration flow
- [ ] Test end-to-end message flow
- [ ] Update documentation for users

## Why This Matters

### Quantum Threat Timeline
- **2030**: Australian ASD requires quantum-safe crypto
- **2033**: NSA requires exclusive use of quantum-safe crypto
- **2035**: NIST prohibits classical cryptography

### Harvest Now, Decrypt Later
Attackers can record encrypted messages today and decrypt them when quantum computers become available. By implementing quantum-safe crypto now, you protect:
- All future messages
- Messages that need long-term confidentiality

## Resources

- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) - ML-KEM Standard
- [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) - JavaScript Implementation
- [Post-Quantum Cryptography FAQ](https://csrc.nist.gov/projects/post-quantum-cryptography/faqs)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify key lengths match expected sizes
3. Ensure program ID is updated everywhere
4. Test with fresh keys to rule out migration issues
