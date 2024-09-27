import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function Transactions() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState(''); 
  const [amount, setAmount] = useState(1); 
  const [transactionStatus, setTransactionStatus] = useState('');

  // Handle the transaction request
  const sendSol = async () => {
    if (!publicKey) {
      setTransactionStatus('Wallet not connected');
      return;
    }

    if (!recipient) {
      setTransactionStatus('Recipient address is required');
      return;
    }

    try {
      setTransactionStatus('Sending transaction...');


       // Step 1: Create a new transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: amount * LAMPORTS_PER_SOL, 
        })
      );

      // Step 2: Get the latest blockhash
      const latestBlockHash = await connection.getLatestBlockhash();
      //why to use latestBlockHash
      //No one can copy your transaction and resend it later


      // Step 3: Attach blockhash and fee payer
      transaction.recentBlockhash = latestBlockHash.blockhash;
      transaction.feePayer = publicKey;

      // Step 4: Sign and send the transaction
      const signature = await sendTransaction(transaction, connection);

      // Step 5: Confirm the transaction
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });

      setTransactionStatus('Transaction successful!');
    } catch (error) {
      setTransactionStatus(`Transaction failed: ${error.message}`);
    }
  }

  return (
    <div className="mt-1">
      <h3 className="mb-4 text-lg font-bold text-gray-700">Send SOL</h3>

      <div className="mb-4">
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Recipient Address"
          className="w-full p-2 text-black border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          placeholder="Amount (SOL)"
          className="w-full p-2 text-black border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
        />
      </div>

      <button
        onClick={sendSol}
        className="px-4 py-2 font-bold text-white transition duration-300 bg-blue-500 rounded-md hover:bg-blue-600"
      >
        Send Transaction
      </button>

      <p className="mt-4 text-sm text-gray-600">{transactionStatus}</p>
    </div>
  );
}
