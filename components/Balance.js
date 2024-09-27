import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const Balance = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const getBalance = async () => {
      if (publicKey) {
        try {
          const lamports = await connection.getBalance(publicKey);
          setBalance(lamports / LAMPORTS_PER_SOL); // Convert lamports to SOL
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance(null);
        }
      }
    };

    getBalance();
  }, [publicKey, connection]);

  return (
    <div className="text-center">
      {publicKey ? (
        <>
          <h3 className="text-lg font-medium text-black">Wallet Balance:</h3>
          <p className="text-xl font-semibold text-blue-600">{balance !== null ? `${balance} SOL` : "Loading..."}</p>
        </>
      ) : (
        <p className="text-sm text-gray-600">Connect your wallet to view the balance.</p>
      )}
    </div>
  );
};

export default Balance;
