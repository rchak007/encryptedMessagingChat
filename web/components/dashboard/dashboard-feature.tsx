import KeyPairGenerator from '@/components/ui/QuantumKeyPairGenerator';
import HomeTiles from '@/components/ui/HomeTiles';
import RegisterWallet from "@/components/relay/register-wallet";
import DecryptComposePanel from "@/components/relay/DecryptComposePanel";

export default function DashboardFeature() {
  return (
    <>
      <HomeTiles />

      <div className="text-center text-lg my-10">
        <p>🔒 Connect your wallet to start chatting securely.</p>
      </div>

      <KeyPairGenerator />

      <RegisterWallet />

      <DecryptComposePanel />
    </>
  );
}
