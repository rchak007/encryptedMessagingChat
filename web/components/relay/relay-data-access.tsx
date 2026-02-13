'use client';

import { Program } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

// Import IDL
import relayIdl from '../../../anchor/target/idl/relay.json';

// QUANTUM-SAFE: Update this with your new program ID after deployment
const programId = new PublicKey("DevpMzGDfkVPuzkGY19S1KDP86YWKECqJ1cSwuVieiD4");

export function useRelayProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const provider = useAnchorProvider();
  const wallet = useWallet();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;
    
    try {
      return new Program(relayIdl as any, provider) as any;
    } catch (e) {
      console.error("Program init error:", e);
      return null;
    }
  }, [provider, wallet.publicKey]);

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster: cluster.name }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const accounts = useQuery({
    queryKey: ['relay', 'all', { cluster: cluster.name }],
    queryFn: () => program?.account.relay.all(),
    enabled: !!program,
  });

  const createEntry = useMutation({
    mutationKey: ['relay', 'create', { cluster: cluster.name }],
    mutationFn: async ({
      title,
      message,
      owner,
      recipient,
      enc
    }: {
      title: string;
      message: string;
      owner: PublicKey;
      recipient: string;
      enc: boolean;
    }) => {
      const [relayAddress] = await PublicKey.findProgramAddress(
        [Buffer.from('relay'), Buffer.from(title), owner.toBuffer()],
        programId
      );

      return program.methods
        .create(title, message, recipient, enc)
        .accounts({ relay: relayAddress })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error('Failed to create entry'),
  });

  return {
    program,
    programId,
    getProgramAccount,
    accounts,
    createEntry,
  };
}

export function useRelayProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useRelayProgram();
  const client = useQueryClient();

  const accountQuery = useQuery({
    queryKey: ['relay', 'fetch', { cluster: cluster.name, account }],
    queryFn: () => program.account.relay.fetch(account),
    enabled: !!program,
  });

  const updateEntry = useMutation({
    mutationKey: ['relay', 'update', { cluster: cluster.name, account }],
    mutationFn: async ({
      title,
      message,
      owner,
      recipient,
      enc
    }: {
      title: string;
      message: string;
      owner: PublicKey;
      recipient: string;
      enc: boolean;
    }) => {
      return program.methods
        .update(title, message, recipient, enc)
        .accounts({ relay: account })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accountQuery.refetch();
    },
    onError: () => toast.error('Failed to update entry'),
  });

  const deleteEntry = useMutation({
    mutationKey: ['relay', 'close', { cluster: cluster.name, account }],
    mutationFn: (title: string) =>
      program.methods.close(title).accounts({ relay: account }).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error('Failed to delete entry'),
  });

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  };
}

export function useRegistryAccount(owner: PublicKey | null) {
  const { program, programId } = useRelayProgram();
  const { cluster } = useCluster();

  const registryPda = owner && programId
    ? PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), owner.toBuffer()],
        programId
      )[0]
    : null;

  const registryQuery = useQuery({
    queryKey: ['registry', 'fetch', { cluster: cluster.name, owner: owner?.toBase58() }],
    queryFn: async () => {
      if (!program || !registryPda) return null;
      try {
        return await program.account.registry.fetch(registryPda);
      } catch (e) {
        return null;
      }
    },
    enabled: !!program && !!registryPda,
  });

  return { registryPda, registryQuery };
}

export function useUserGroups(userPublicKey: PublicKey | null) {
  const { program } = useRelayProgram();
  const { cluster } = useCluster();

  const groupsQuery = useQuery({
    queryKey: ['groups', 'all', { cluster: cluster.name, user: userPublicKey?.toBase58() }],
    queryFn: async () => {
      if (!program || !userPublicKey) return [];
      try {
        const allGroups = await program.account.groupState.all();
        return allGroups.filter((g: any) => 
          g.account.members.some((m: PublicKey) => m.equals(userPublicKey))
        );
      } catch (e) {
        return [];
      }
    },
    enabled: !!program && !!userPublicKey,
  });

  return groupsQuery;
}

export function useGroup(groupPubkey: PublicKey | null) {
  const { program } = useRelayProgram();
  const { cluster } = useCluster();

  const groupQuery = useQuery({
    queryKey: ['group', 'fetch', { cluster: cluster.name, group: groupPubkey?.toBase58() }],
    queryFn: async () => {
      if (!program || !groupPubkey) return null;
      try {
        return await program.account.groupState.fetch(groupPubkey);
      } catch (e) {
        return null;
      }
    },
    enabled: !!program && !!groupPubkey,
  });

  return groupQuery;
}

export function useGroupMessages(groupPubkey: PublicKey | null) {
  const { program } = useRelayProgram();
  const { cluster } = useCluster();

  const messagesQuery = useQuery({
    queryKey: ['group-messages', { cluster: cluster.name, group: groupPubkey?.toBase58() }],
    queryFn: async () => {
      if (!program || !groupPubkey) return [];
      try {
        const allMessages = await program.account.groupMessage.all();
        return allMessages
          .filter((m: any) => m.account.group.equals(groupPubkey))
          .sort((a: any, b: any) => Number(a.account.msgId) - Number(b.account.msgId));
      } catch (e) {
        return [];
      }
    },
    enabled: !!program && !!groupPubkey,
    refetchInterval: 10000,
  });

  return messagesQuery;
}