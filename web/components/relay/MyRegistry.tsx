"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRegistryAccount } from "@/components/relay/relay-data-access";

export default function MyRegistry() {
  const { publicKey } = useWallet();
  const { registryPda, registryQuery } = useRegistryAccount(publicKey);

  if (!publicKey) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-center text-sm opacity-80">
          Connect your wallet to view your registry
        </div>
      </div>
    );
  }

  if (registryQuery.isLoading) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-sm opacity-80">Loading registry...</p>
        </div>
      </div>
    );
  }

  if (!registryQuery.data) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-center text-sm opacity-80">
          ❌ No registry found. Please register your wallet first.
        </div>
      </div>
    );
  }

  const registry = registryQuery.data;

  return (
    <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
      <div className="text-lg font-semibold mb-4">📋 Your Quantum-Safe Registry</div>
      
      <div className="alert alert-success mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">Protected by ML-KEM-768 (NIST FIPS 203)</span>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-base-300 rounded-lg">
          <div className="text-xs opacity-60 mb-1">Wallet Address</div>
          <div className="text-sm font-mono break-all">
            {registry.owner.toBase58()}
          </div>
        </div>

        <div className="p-3 bg-base-300 rounded-lg">
          <div className="text-xs opacity-60 mb-1">ML-KEM-768 Public Key</div>
          <div className="text-sm font-mono break-all">
            {registry.pqPublicKey || registry.naclPublicKey}
          </div>
          <div className="text-xs opacity-40 mt-1">
            Length: {(registry.pqPublicKey || registry.naclPublicKey)?.length} characters
          </div>
        </div>

        <div className="p-3 bg-base-300 rounded-lg">
          <div className="text-xs opacity-60 mb-1">Registry PDA</div>
          <div className="text-sm font-mono break-all">
            {registryPda?.toBase58()}
          </div>
        </div>

        <div className="p-3 bg-base-300 rounded-lg">
          <div className="text-xs opacity-60 mb-1">Last Updated (Slot)</div>
          <div className="text-sm font-mono">
            {registry.updatedAtSlot.toString()}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-center opacity-60">
        <a 
          href={`https://solscan.io/account/${registryPda?.toBase58()}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-primary"
        >
          View on Solscan ↗
        </a>
      </div>
    </div>
  );
}