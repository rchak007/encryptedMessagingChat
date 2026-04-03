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

  const [pqPub, setPqPub] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    // return localStorage.getItem("pqPublicKey") || "";
    return localStorage.getItem("pq_public_key") || "";
  });

  const [txSig, setTxSig] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [registryData, setRegistryData] = useState<any>(null);
  const [loadingRegistry, setLoadingRegistry] = useState(false);

  const registryPda = useMemo(() => {
    if (!publicKey || !programId) return null;
    return getRegistryPda(programId, publicKey);
  }, [publicKey, programId]);

  // Fetch existing registry data on load
  useEffect(() => {
    let cancelled = false;
    const fetchRegistry = async () => {
      if (!program || !registryPda) return;
      setLoadingRegistry(true);
      try {
        const reg = await program.account.registry.fetch(registryPda);
        if (!cancelled) {
          console.log('Registry keys:', Object.keys(reg));
          setRegistryData(reg);
        }
      } catch {
        if (!cancelled) setRegistryData(null);
      } finally {
        if (!cancelled) setLoadingRegistry(false);
      }
    };
    fetchRegistry();
    return () => { cancelled = true; };
  }, [program?.programId?.toString(), registryPda?.toString(), txSig]);

  // useEffect(() => {
  //   let cancelled = false;
  //   const fetchRegistry = async () => {
  //     if (!program || !registryPda) return;
  //     setLoadingRegistry(true);
  //     try {
  //       const reg = await program.account.registry.fetch(registryPda);
  //       console.log('Registry keys:', Object.keys(reg)); 
  //       setRegistryData(reg);
  //     } catch {
  //       setRegistryData(null); // not registered yet
  //     } finally {
  //       setLoadingRegistry(false);
  //     }
  //   };
  //   fetchRegistry();
  // }, [program, registryPda, txSig]); // re-fetch after successful registration

  const canSubmit = !!publicKey && !!program && !!connected && pqPub.trim().length > 0;

  const onRegister = async () => {
    if (!publicKey || !program || !registryPda) return;

    try {
      setStatus("Registering quantum-safe key on-chain...");
      setTxSig("");

      // const pubKeyBytes = Array.from(Buffer.from(pqPub.trim(), 'base64'));
      const cleanKey = pqPub.replace(/\s+/g, '');  // remove ALL whitespace/newlines
      // const pubKeyBytes = Buffer.from(cleanKey, 'base64');
      // const pubKeyBytes = Array.from(Buffer.from(cleanKey, 'base64'));
      // const pubKeyBytes = Buffer.from(cleanKey, 'base64');
      // const pubKeyBytes = new Uint8Array(Buffer.from(cleanKey, 'base64'));
      // const pubKeyBytes = Array.from(new Uint8Array(Buffer.from(cleanKey, 'base64')));

      // FIX: Anchor expects Buffer directly for Vec<u8>, not Array
      // const pubKeyBuffer = Buffer.from(cleanKey, 'base64');

      // Anchor "bytes" type requires a proper Buffer (not Uint8Array)
      // Error: Blob.encode[data] requires (length 1184) Buffer as src
      const pubKeyBuffer = Buffer.from(cleanKey, 'base64');

      if (pubKeyBuffer.length !== 1184) {
        setStatus(`❌ Invalid key length: ${pubKeyBuffer.length} bytes (expected 1184)`);
        return;
      }

      // Verify it's a proper Buffer with correct length
      console.log('Key length chars:', cleanKey.length);
      console.log('Key length bytes:', pubKeyBuffer.length);
      console.log('Is Buffer:', Buffer.isBuffer(pubKeyBuffer));

      const sig = await program.methods
        .register(pubKeyBuffer)  // Pass as Node.js Buffer
        // .register(pqPub.trim())
        .accounts({
          registry: registryPda,
          owner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSig(sig);
      setStatus("✅ Quantum-safe key registered!");
      // localStorage.setItem("pqPublicKey", pqPub.trim());
      localStorage.setItem("pq_public_key", pqPub.trim());
    } catch (e: any) {
      console.error("❌ Registration failed:", e);
      setStatus(`❌ Failed: ${e?.message ?? e}`);
    }
  };

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
            <p className="mb-4 text-sm opacity-80">🔒 Please connect your wallet to register</p>
            <WalletButton />
          </div>
        )}
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-4">🔐 Register Quantum-Safe Key</div>
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-sm opacity-80">Loading program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8 max-w-xl mx-auto">

      {/* Register box */}
      <div className="rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold">🔐 Register Quantum-Safe Key</div>
        <div className="text-sm opacity-80 mt-1">
          Register your ML-KEM-768 public key to the on-chain Registry PDA.
        </div>

        <div className="alert alert-info mt-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-xs">Using ML-KEM-768 (NIST FIPS 203) - Post-Quantum Cryptography</span>
        </div>

        <div className="mt-3 p-2 bg-base-300 rounded text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            {/* <span>Wallet: {publicKey.toBase58().slice(0, 8)}...</span> */}
            <span>Wallet: {publicKey?.toBase58()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            {/* <span>Program: {programId?.toBase58().slice(0, 8)}...</span> */}
            <span>Program: {programId?.toBase58()}</span>
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

        {registryPda && (
          <div className="text-xs mt-3 opacity-80 break-all">
            Registry PDA: {registryPda.toBase58()}
          </div>
        )}

        {status && <div className="text-sm mt-3 font-semibold">{status}</div>}
        {txSig && (
          <div className="text-xs mt-2 break-all opacity-80">Tx: {txSig}</div>
        )}
      </div>

      {/* Your Registry box */}
      <div className="rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-3">📋 Your Quantum-Safe Registry</div>

        {loadingRegistry ? (
          <div className="text-center py-4">
            <div className="loading loading-spinner loading-sm"></div>
          </div>
        ) : registryData ? (
          <div className="space-y-3">
            {/* Protected badge */}
            <div className="flex items-center gap-2 bg-grey-900/30 border border-red-700/40 text-red-400 px-3 py-2 rounded-lg text-sm">
              <span>✓</span> Protected by ML-KEM-768 (NIST FIPS 203)
            </div>

            <div className="bg-base-300 rounded-xl p-3 space-y-3 text-xs">
              <div>
                <div className="opacity-60 mb-1">Wallet Address</div>
                <div className="font-mono break-all">{registryData.owner?.toBase58()}</div>
              </div>
              <div>
                <div className="opacity-60 mb-1">ML-KEM-768 Public Key</div>
                <div className="font-mono break-all text-cyan-600">
                  {/* {registryData.pqPublicKey?.slice(0, 60)}... */}
                  {registryData.pqPublicKey ? Buffer.from(registryData.pqPublicKey).toString('base64').slice(0, 60) : ''}...
                </div>
                {/* <div className="opacity-40 mt-1">Length: {registryData.pqPublicKey?.length} characters</div> */}
                <div className="opacity-40 mt-1">Length: {registryData.pqPublicKey ? Buffer.from(registryData.pqPublicKey).toString('base64').length : 0} characters</div>
              </div>
              <div>
                <div className="opacity-60 mb-1">Registry PDA</div>
                <div className="font-mono break-all">{registryPda?.toBase58()}</div>
              </div>
              <div>
                <div className="opacity-60 mb-1">Last Updated (Slot)</div>
                <div className="font-mono">{registryData.updatedAtSlot?.toString()}</div>
              </div>
            </div>

            {registryPda && (
              <a
                href={`https://solscan.io/account/${registryPda.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-center block text-purple-400 hover:text-purple-300 transition-colors mt-2"
              >
                View on Solscan 🔗
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm opacity-60">
            No registry found for this wallet. Register your key above.
          </div>
        )}
      </div>

    </div>
  );
}
