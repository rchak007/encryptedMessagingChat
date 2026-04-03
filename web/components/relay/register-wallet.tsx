"use client";

import { useMemo, useState, useEffect } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRelayProgram } from "@/components/relay/relay-data-access";
import { WalletButton } from "@/components/solana/solana-provider";

const PQ_KEY_HALF = 592;
const PQ_KEY_TOTAL = 1184;

function getRegistryPda(programId: PublicKey, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), owner.toBuffer()],
    programId
  )[0];
}

export default function RegisterWallet() {
  const wallet = useWallet();
  const { publicKey, connected, connecting, signAllTransactions } = wallet;
  const { connection } = useConnection();
  const { program, programId } = useRelayProgram();

  const [pqPub, setPqPub] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("pq_public_key") || "";
  });

  const [txSig, setTxSig] = useState<string>("");
  const [txSig2, setTxSig2] = useState<string>("");
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
          console.log("Registry keys:", Object.keys(reg));
          setRegistryData(reg);
        }
      } catch {
        if (!cancelled) setRegistryData(null);
      } finally {
        if (!cancelled) setLoadingRegistry(false);
      }
    };
    fetchRegistry();
    return () => {
      cancelled = true;
    };
  }, [program?.programId?.toString(), registryPda?.toString(), txSig, txSig2]);

  const canSubmit =
    !!publicKey &&
    !!program &&
    !!connected &&
    !!signAllTransactions &&
    pqPub.trim().length > 0;

  const onRegister = async () => {
    if (!publicKey || !program || !registryPda || !signAllTransactions) return;

    try {
      setStatus("Preparing two-part quantum key registration...");
      setTxSig("");
      setTxSig2("");

      // --- 1. Decode the base64 key into raw bytes ---
      const cleanKey = pqPub.replace(/\s+/g, "");
      const fullKeyBytes = new Uint8Array(Buffer.from(cleanKey, "base64"));

      if (fullKeyBytes.length !== PQ_KEY_TOTAL) {
        setStatus(
          `❌ Invalid key length: ${fullKeyBytes.length} bytes (expected ${PQ_KEY_TOTAL})`
        );
        return;
      }

      console.log("Key length chars:", cleanKey.length);
      console.log("Key length bytes:", fullKeyBytes.length);

      // --- 2. Split into two 592-byte chunks ---
      const chunk1 = Array.from(fullKeyBytes.slice(0, PQ_KEY_HALF));
      const chunk2 = Array.from(fullKeyBytes.slice(PQ_KEY_HALF));

      console.log("Chunk 1 length:", chunk1.length);
      console.log("Chunk 2 length:", chunk2.length);

      // --- 3. Build both transactions ---
      setStatus("Building transactions...");

      // Use Buffer.from for chunk data passed to Anchor
      const tx1instruction = await program.methods
        .registerPart1(Buffer.from(chunk1))
        .accounts({
          registry: registryPda,
          owner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const tx2instruction = await program.methods
        .registerPart2(Buffer.from(chunk2))
        .accounts({
          registry: registryPda,
          owner: publicKey,
        })
        .instruction();

      // Get a fresh blockhash for both transactions
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      const tx1 = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(tx1instruction);

      const tx2 = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(tx2instruction);

      // --- 4. Sign BOTH transactions in one wallet popup ---
      setStatus("Please approve 2 transactions in your wallet...");
      const signedTxs = await signAllTransactions([tx1, tx2]);

      // --- 5. Send tx1 and wait for confirmation ---
      setStatus("Sending part 1 of 2 (bytes 0–591)...");
      const sig1 = await connection.sendRawTransaction(
        signedTxs[0].serialize()
      );
      console.log("Part 1 sent:", sig1);
      setTxSig(sig1);

      // Wait for confirmation before sending part 2
      await connection.confirmTransaction(
        { signature: sig1, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      setStatus("Part 1 confirmed! Sending part 2 of 2 (bytes 592–1183)...");

      // --- 6. Send tx2 and wait for confirmation ---
      const sig2 = await connection.sendRawTransaction(
        signedTxs[1].serialize()
      );
      console.log("Part 2 sent:", sig2);
      

      await connection.confirmTransaction(
        { signature: sig2, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      // Small delay to let RPC node catch up before re-fetch triggers
      await new Promise((r) => setTimeout(r, 1500));

      setStatus("✅ Quantum-safe key fully registered on-chain!");
      setTxSig2(sig2);  // Moved AFTER confirmation + delay so registry re-fetch sees is_complete = true
      localStorage.setItem("pq_public_key", pqPub.trim());
    } catch (e: any) {
      console.error("❌ Registration failed:", e);
      setStatus(`❌ Failed: ${e?.message ?? e}`);
    }
  };

  if (!connected) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-4">
          🔐 Register Quantum-Safe Key
        </div>
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

  if (!program) {
    return (
      <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-4">
          🔐 Register Quantum-Safe Key
        </div>
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
        <div className="text-lg font-semibold">
          🔐 Register Quantum-Safe Key
        </div>
        <div className="text-sm opacity-80 mt-1">
          Register your ML-KEM-768 public key to the on-chain Registry PDA.
        </div>

        <div className="alert alert-info mt-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span className="text-xs">
            Using ML-KEM-768 (NIST FIPS 203) - Post-Quantum Cryptography
          </span>
        </div>

        <div className="alert alert-warning mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"
            ></path>
          </svg>
          <span className="text-xs">
            Key is split into 2 transactions (592 bytes each) due to Solana tx
            size limits. You will approve both in a single wallet popup.
          </span>
        </div>

        <div className="mt-3 p-2 bg-base-300 rounded text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Wallet: {publicKey.toBase58()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Program: {programId?.toBase58()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={signAllTransactions ? "text-green-500" : "text-red-500"}>
              {signAllTransactions ? "✓" : "✗"}
            </span>
            <span>
              Batch signing: {signAllTransactions ? "supported" : "not supported by this wallet"}
            </span>
          </div>
        </div>

        <label className="block text-sm mt-4 mb-2">
          ML-KEM-768 Public Key (Base64)
        </label>
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
          🔐 Register Quantum-Safe Key (2-Part)
        </button>

        {registryPda && (
          <div className="text-xs mt-3 opacity-80 break-all">
            Registry PDA: {registryPda.toBase58()}
          </div>
        )}

        {status && <div className="text-sm mt-3 font-semibold">{status}</div>}
        {txSig && (
          <div className="text-xs mt-2 break-all opacity-80">
            Tx 1 (part 1): {txSig}
          </div>
        )}
        {txSig2 && (
          <div className="text-xs mt-1 break-all opacity-80">
            Tx 2 (part 2): {txSig2}
          </div>
        )}
      </div>

      {/* Your Registry box */}
      <div className="rounded-2xl border border-gray-700 bg-base-200 p-5">
        <div className="text-lg font-semibold mb-3">
          📋 Your Quantum-Safe Registry
        </div>

        {loadingRegistry ? (
          <div className="text-center py-4">
            <div className="loading loading-spinner loading-sm"></div>
          </div>
        ) : registryData ? (
          <div className="space-y-3">
            {/* Status badge — changes based on is_complete */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                registryData.isComplete
                  ? "bg-green-900/30 border border-green-700/40 text-green-400"
                  : "bg-yellow-900/30 border border-yellow-700/40 text-yellow-400"
              }`}
            >
              <span>{registryData.isComplete ? "✓" : "⏳"}</span>
              {registryData.isComplete
                ? "Protected by ML-KEM-768 (NIST FIPS 203)"
                : "Registration incomplete — part 2 pending"}
            </div>

            <div className="bg-base-300 rounded-xl p-3 space-y-3 text-xs">
              <div>
                <div className="opacity-60 mb-1">Wallet Address</div>
                <div className="font-mono break-all">
                  {registryData.owner?.toBase58()}
                </div>
              </div>
              <div>
                <div className="opacity-60 mb-1">ML-KEM-768 Public Key</div>
                <div className="font-mono break-all text-cyan-600">
                  {registryData.pqPublicKey
                    ? Buffer.from(registryData.pqPublicKey)
                        .toString("base64")
                        .slice(0, 60)
                    : ""}
                  ...
                </div>
                <div className="opacity-40 mt-1">
                  Length:{" "}
                  {registryData.pqPublicKey
                    ? Buffer.from(registryData.pqPublicKey).toString("base64")
                        .length
                    : 0}{" "}
                  characters
                </div>
              </div>
              <div>
                <div className="opacity-60 mb-1">Registration Status</div>
                <div className="font-mono">
                  {registryData.isComplete ? "Complete ✅" : "Incomplete ⏳"}
                </div>
              </div>
              <div>
                <div className="opacity-60 mb-1">Registry PDA</div>
                <div className="font-mono break-all">
                  {registryPda?.toBase58()}
                </div>
              </div>
              <div>
                <div className="opacity-60 mb-1">Last Updated (Slot)</div>
                <div className="font-mono">
                  {registryData.updatedAtSlot?.toString()}
                </div>
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