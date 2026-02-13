'use client';

import { Keypair, PublicKey } from '@solana/web3.js';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useRelayProgram,
  useRelayProgramAccount,
} from './relay-data-access';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

// QUANTUM-SAFE: Replace NaCl with ML-KEM
import { encryptMessage, decryptMessage, toBase64, fromBase64 } from '@/lib/quantum-crypto';
import Modal from 'react-modal';

export function RelayCreate() {
  const { createEntry } = useRelayProgram();
  const { publicKey } = useWallet();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [myPrivateKey, setMyPrivateKey] = useState(''); // Changed from myKey
  const [myPublicKey, setMyPublicKey] = useState(''); 
  const [enc, setEnc] = useState(false);

  const isFormValid = title.trim() !== '' && message.trim() !== '' && recipient.trim() !== '' && myPrivateKey.trim() !== '' && myPublicKey.trim() !== '';

  const handleSubmit = async () => {
    if (publicKey && isFormValid) {
      console.log("recipient public key length", recipient.length);

      let encryptedMessage = message;

      if (enc) {
        try {
          // QUANTUM-SAFE: Use ML-KEM encryption
          const { ciphertext, nonce } = await encryptMessage(message, recipient);
          
          encryptedMessage = JSON.stringify({
            ciphertext: ciphertext,
            nonce: nonce,
            senderPublicKey: myPublicKey
          });
          
          console.log("Length of encryptedMessage:", new TextEncoder().encode(encryptedMessage).length);
        } catch (error) {
          console.error("Encryption failed:", error);
          alert("Failed to encrypt message. Check console for details.");
          return;
        }
      }

      console.log("recipient length", recipient.length);
      console.log("title length", title.length);
      console.log("encryptedMessage length", encryptedMessage.length);

      createEntry.mutateAsync({ title, message: encryptedMessage, owner: publicKey, recipient: recipient, enc });
    }
  };

  if (!publicKey){
    return <p>Connect your wallet</p>
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Address"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-bordered input-xs w-full max-w-xs mb-1"
      />
      
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="textarea textarea-bordered textarea-xs w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Recipient ML-KEM Public Key (Base64)"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="input input-bordered input-xs w-full max-w-xs mb-1"
      />
      <input
        type="text"
        placeholder="Your Private Key (Base64) - will NOT be stored"
        value={myPrivateKey}
        onChange={(e) => setMyPrivateKey(e.target.value)}
        className="input input-bordered input-xs w-full max-w-xs mb-1"
      />
      <input
        type="text"
        placeholder="Your Public Key (Base64)"
        value={myPublicKey}
        onChange={(e) => setMyPublicKey(e.target.value)}
        className="input input-bordered input-xs w-full max-w-xs mb-1"
      />
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">🔐 Quantum-Safe Encrypt</span>
          <input
            type="checkbox"
            checked={enc}
            onChange={(e) => setEnc(e.target.checked)}
            className="checkbox checkbox-primary"
          />
        </label>
      </div>            
      <br></br>
      <button
        className="btn btn-xs sm:btn-sm btn-accent"
        onClick={handleSubmit}
        disabled={createEntry.isPending || !isFormValid}
      >
        Send Message Entry {createEntry.isPending && '...'}
      </button>
    </div>
  );
}


export function RelayList() {
  const { accounts, getProgramAccount } = useRelayProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="flex justify-center alert alert-info">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid gap-4 md:grid-cols-1">
          {accounts.data?.map((account) => (
            <RelayCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function RelayCard({ account }: { account: PublicKey }) {
  const {
    accountQuery,
    updateEntry, 
    deleteEntry
  } = useRelayProgramAccount({ account });
  const { publicKey, signMessage } = useWallet();
  const [message, setMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  
  const title = accountQuery.data?.title; 
  const recipient = accountQuery.data?.recipient || '';
  const enc = accountQuery.data?.enc;

  const isJSON = (str: string) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const messageData = enc && accountQuery.data?.message && isJSON(accountQuery.data.message)
    ? JSON.parse(accountQuery.data.message)
    : accountQuery.data?.message;

  const isFormValid = message.trim() !== '' && recipient !== undefined && enc !== undefined;

  const handleSubmit = () => {
    if (publicKey && isFormValid && title) {
      updateEntry.mutateAsync({ title, message, owner: publicKey, recipient, enc });
    }
  };

  const handleDecrypt = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setDecryptedMessage(null);
    setPrivateKeyInput('');
  };

  const handleDecryptMessage = async () => {
    try {
      const messageData = accountQuery.data?.message ? JSON.parse(accountQuery.data.message) : null;
      if (messageData) {
        // QUANTUM-SAFE: Use ML-KEM decryption
        const decrypted = await decryptMessage(
          messageData.ciphertext,
          privateKeyInput
        );
        setDecryptedMessage(decrypted);
      }
    } catch (error) {
      console.error('Failed to decrypt message', error);
      setDecryptedMessage('❌ Failed to decrypt message. Check your private key.');
    }
  };  

  if (!publicKey){
    return <p>Connect your wallet</p>
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="chat chat-start">
      <div className="p-2">
        <div className="space-y-2">
          
          <div className="chat-header">
          <p
            className="link text-xs text-accent"
            onClick={() => accountQuery.refetch()}
          >
            {accountQuery.data?.title}
          </p>
          </div>
          
          <div className="chat-bubble">
          <p> 
          {decryptedMessage || accountQuery.data?.message}
          </p>
          <p>Recipient: {recipient?.toString()}</p>
          <p>Encrypted: {enc ? '🔐 Quantum-Safe' : 'No'}</p>
          {enc && (
              <button onClick={handleDecrypt} className="btn btn-xs sm:btn-sm btn-accent">
                Decrypt
              </button>
            )}
          </div>

          <div className="text-left">
            <div className="chat-footer opacity-50">
            <p>
              <ExplorerLink
                className='text-xs link'
                path={`account/${account}`}
                label={ellipsify(account.toString())}
              />
            &nbsp;
            <button
              className="btn btn-circle btn-outline"
              onClick={() => {
                if (
                  !window.confirm(
                    'Are you sure you want to close this account?'
                  )
                ) {
                  return;
                }
                const title = accountQuery.data?.title;
                if (title) {
                  return deleteEntry.mutateAsync(title);
                }
              }}
              disabled={deleteEntry.isPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </p>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onRequestClose={handleModalClose}>
        <h2>🔓 Decrypt Quantum-Safe Message</h2>
        {decryptedMessage ? (
          <div>
            <p className="font-bold">Decrypted Message:</p>
            <p className="p-4 bg-base-200 rounded mt-2">{decryptedMessage}</p>
            <button onClick={handleModalClose} className="btn btn-accent mt-4">Close</button>
          </div>
        ) : (
          <div>
            <p className="text-xs opacity-60 mb-2">Ciphertext: {messageData?.ciphertext?.substring(0, 50)}...</p>
            <p className="text-xs opacity-60 mb-2">Sender: {messageData?.senderPublicKey?.substring(0, 50)}...</p>
            <input
              type="password"
              placeholder="Enter your ML-KEM private key"
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              className="input input-bordered w-full mb-2"
            />
            <button onClick={handleDecryptMessage} className="btn btn-accent">🔓 Decrypt</button>
          </div>
        )}
      </Modal>
    </div>
  );
}