"use client";

import { useMemo, useState, useEffect } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRelayProgram } from "@/components/relay/relay-data-access";
import { WalletButton } from "@/components/solana/solana-provider";

function getRegistryPda(programId: PublicKey, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), owner.toBuffer()],
    programId
  )[0];
}

export default function RegisterWallet() {
  const wallet = useWallet();
  const { publicKey, connected, connecting } = wallet;
  const { program, programId } = useRelayProgram();

  // QUANTUM-SAFE: Changed from naclPub to pqPub
  const [pqPub, setPqPub] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("pqPublicKey") || "";
  });

  const [txSig, setTxSig] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Debug wallet state
  useEffect(() => {
    console.log("🔍 RegisterWallet - Wallet State:", {
      hasPublicKey: !!publicKey,
      publicKey: publicKey?.toBase58(),
      connected,
      connecting,
      hasProgram: !!program,
    });
  }, [publicKey, connected, connecting, program]);

  const canSubmit = !!publicKey && !!program && !!connected && pqPub.trim().length > 0;

  const registryPda = useMemo(() => {
    if (!publicKey || !programId) return null;
    return getRegistryPda(programId, publicKey);
  }, [publicKey, programId]);

  const onRegister = async () => {
    if (!publicKey || !program || !registryPda) {
      console.error("❌ Missing requirements:", { publicKey, program, registryPda });
      return;
    }

    try {
      setStatus("Registering quantum-safe key on-chain...");
      setTxSig("");

      console.log("🔍 Calling register instruction:", {
        pqPub: pqPub.trim().substring(0, 50) + "...",
        registry: registryPda.toBase58(),
        owner: publicKey.toBase58(),
      });

      const sig = await program.methods
        .register(pqPub.trim())
        .accounts({
          registry: registryPda,
          owner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSig(sig);
      setStatus("✅ Quantum-safe key registered!");
      localStorage.setItem("pqPublicKey", pqPub.trim());
      
      console.log("✅ Registration successful:", sig);
    } catch (e: any) {
      console.error("❌ Registration failed:", e);
      setStatus(`❌ Failed: ${e?.message ?? e}`);
    }
  };

  // Show wallet connection UI if not connected
  if (!connected) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-4">🔐 Register Quantum-Safe Key</div>
        
        {connecting ? (
          <div className="text-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-sm opacity-80">Connecting wallet...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="mb-4 text-sm opacity-80">
              🔒 Please connect your wallet to register
            </p>
            <WalletButton />
          </div>
        )}
      </div>
    );
  }

  // Wallet is connected but program not loaded
  if (!program) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-4">🔐 Register Quantum-Safe Key</div>
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-sm opacity-80">Loading program...</p>
          <p className="text-xs opacity-60 mt-2">
            Wallet: {publicKey?.toBase58().slice(0, 8)}...
          </p>
        </div>
      </div>
    );
  }

  // Everything is ready
  return (
    <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
      <div className="text-lg font-semibold">🔐 Register Quantum-Safe Key</div>
      <div className="text-sm opacity-80 mt-1">
        Register your ML-KEM-768 public key to the on-chain Registry PDA.
      </div>

      {/* Info Badge */}
      <div className="alert alert-info mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span className="text-xs">Using ML-KEM-768 (NIST FIPS 203) - Post-Quantum Cryptography</span>
      </div>

      {/* Status Info */}
      <div className="mt-3 p-2 bg-base-300 rounded text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Wallet: {publicKey.toBase58().slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Program: {programId?.toBase58().slice(0, 8)}...</span>
        </div>
      </div>

      <label className="block text-sm mt-4 mb-2">ML-KEM-768 Public Key (Base64)</label>
      <textarea
        className="w-full rounded-xl border border-gray-600 bg-base-100 px-3 py-2 font-mono text-xs"
        placeholder="Paste your ML-KEM-768 public key (~1580 characters)"
        rows={4}
        value={pqPub}
        onChange={(e) => setPqPub(e.target.value)}
      />
      
      <div className="text-xs opacity-60 mt-1">
        Expected length: ~1580 characters (1184 bytes base64 encoded)
      </div>

      <button
        className={`mt-4 w-full rounded-xl px-4 py-2 font-semibold transition-colors ${
          canSubmit 
            ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer" 
            : "bg-gray-600 text-gray-400 cursor-not-allowed"
        }`}
        disabled={!canSubmit}
        onClick={onRegister}
      >
        🔐 Register Quantum-Safe Key
      </button>

      {!canSubmit && pqPub.trim().length === 0 && (
        <div className="text-xs text-yellow-500 mt-2">
          ⚠️ Generate and paste your ML-KEM-768 public key above
        </div>
      )}

      {registryPda && (
        <div className="text-xs mt-3 opacity-80 break-all">
          Registry PDA: {registryPda.toBase58()}
        </div>
      )}

      {status && <div className="text-sm mt-3 font-semibold">{status}</div>}
      {txSig && (
        <div className="text-xs mt-2 break-all opacity-80">
          Tx: {txSig}
        </div>
      )}
    </div>
  );
}