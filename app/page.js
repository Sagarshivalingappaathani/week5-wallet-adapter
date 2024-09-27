"use client";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import Airdrop from '@/components/Airdrop';
import Balance from '@/components/Balance';
import Transaction from '@/components/Transaction';
import SignMessage from '@/components/SignMessage';
import AllTokens from '@/components/AllTokens';

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col items-center justify-center min-h-screen py-6 bg-gray-100">
            <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg">
              <h1 className="mb-4 text-2xl font-bold text-center text-blue-500">Solana dApp</h1>
              
              {/* Devnet Warning Message */}
              <p className="mb-4 text-red-500 text-center">
                This dApp works only for Devnet. Please switch your wallet to Developer Mode before connecting.
              </p>
              
              {/* Row 1: Connect, Balance, Disconnect */}
              <div className="flex justify-between mb-6 space-x-4">
                <WalletMultiButton className="btn-primary" />
                <Balance />
                <WalletDisconnectButton className="btn-secondary" />
              </div>
              
              {/* Row 2: Airdrop and Transaction - Equal Space */}
              <div className="flex justify-between mb-6">
                <div className="flex-1 mx-2">
                  <Airdrop />
                </div>
                <div className="flex-1 mx-2">
                  <Transaction />
                </div>
              </div>
              
              {/* Row 3: Sign Message, Your Tokens */}
              <div className="flex justify-between mb-6 space-x-4">
                <SignMessage />
                <AllTokens />
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
