"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { WalletButton } from "@/components/solana/solana-provider";

/**
 * This component waits for the wallet adapter to finish auto-connecting
 * before rendering children. This prevents the "connected but not connected" bug.
 */
export function WalletConnectionGate({ children }: { children: React.ReactNode }) {
  const { connected, connecting, wallet, publicKey } = useWallet();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a bit for autoConnect to complete
    const timer = setTimeout(() => {
      console.log("🚪 WalletConnectionGate - Ready check:", {
        connected,
        connecting,
        hasWallet: !!wallet,
        hasPublicKey: !!publicKey,
      });
      setIsReady(true);
    }, 500); // Give autoConnect 500ms to complete

    return () => clearTimeout(timer);
  }, [connected, connecting, wallet, publicKey]);

  // Show loading while autoConnect is happening
  if (!isReady || connecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-sm opacity-80">Initializing wallet...</p>
      </div>
    );
  }

  // If not connected after autoConnect completes, show connect button
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">🔒 Wallet Required</p>
          <p className="text-sm opacity-80 mb-4">
            Please connect your wallet to continue
          </p>
          <WalletButton />
        </div>
      </div>
    );
  }

  // Wallet is connected and ready
  return <>{children}</>;
}