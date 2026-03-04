import { UiLayout } from '@/components/ui/ui-layout';
import KeyPairGenerator from '@/components/ui/KeyPairGenerator';
import HomeTiles from '@/components/ui/HomeTiles';
import RegisterWallet from "@/components/relay/register-wallet";
import { WalletConnectionGate } from "@/components/relay/WalletConnectionGate";
import MyRegistry from "@/components/relay/MyRegistry";

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Relay', path: '/relay' },
  { label: 'Docs', path: '/docs' },
];

export default function DashboardFeature() {
  return (
    <UiLayout links={navLinks}>
      <HomeTiles />

      {/* Middle section for chat (if wallet connected) */}
      <div className="text-center text-lg my-10">
        <p>🔒 Connect your wallet to start chatting securely.</p>
      </div>

      {/* Bottom: optional local encryption setup */}
      <KeyPairGenerator />

      {/* Wallet registration - wrapped in connection gate */}
      <WalletConnectionGate>
        <RegisterWallet />
        <MyRegistry />
      </WalletConnectionGate>
    </UiLayout>
  );
}