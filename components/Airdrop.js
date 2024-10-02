import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'react-toastify';

export default function Airdrop() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState(1); // Default 1 SOL

  const requestAirdrop = async () => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      toast.info('Requesting airdrop...');
      const signature = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });

      toast.success('Airdrop successful!');
    } catch (error) {
      toast.error(`Airdrop failed: ${error.message}`);
    }
  };

  return (
    <div>
      {publicKey ? (
        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-700">Request Sol</h3>
          <h3 className='text-green-500'>Wallet Address: {publicKey.toBase58()}</h3>

          <div className="mb-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              placeholder="Enter SOL amount"
              className="w-full p-2 text-black border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={requestAirdrop}
            className="px-4 py-2 font-bold text-white transition duration-300 bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Request Airdrop
          </button>
        </div>
      ) : (
        <p className="text-gray-600">Connect your wallet to request an airdrop.</p>
      )}
    </div>
  );
}
