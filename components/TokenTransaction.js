import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError, 
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { useState } from 'react';

const isValidBase58Address = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

const TokenTransaction = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [tokenMintAddress, setTokenMintAddress] = useState('');
  const [amount, setAmount] = useState('1000000000');
  const [status, setStatus] = useState('');

  const resetForm = () => {
    setRecipientAddress('');
    setTokenMintAddress('');
    setAmount('');
  };

  const handleTransfer = async () => {
    if (!publicKey) {
      setStatus('Please connect your wallet!');
      return;
    }
  
    // Validate recipient and token mint addresses
    if (!isValidBase58Address(recipientAddress)) {
      setStatus('Invalid recipient address!');
      return;
    }
  
    if (!isValidBase58Address(tokenMintAddress)) {
      setStatus('Invalid token mint address!');
      return;
    }
  
    try {
      const recipientPublicKey = new PublicKey(recipientAddress);
      const mintPublicKey = new PublicKey(tokenMintAddress);
  
      // Get the associated token account for the sender
      const senderTokenAccount = await getAssociatedTokenAddress(mintPublicKey, publicKey);
  
      // Check if the recipient's associated token account exists
      const recipientTokenAccount = await getAssociatedTokenAddress(mintPublicKey, recipientPublicKey);
  
      // If the recipient's token account does not exist, create it
      try {
        await getAccount(connection, recipientTokenAccount);
      } catch (error) {
        console.log(error);
        if (error instanceof TokenAccountNotFoundError) {
          // Create associated token account
          const transaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              publicKey,           // Payer
              recipientTokenAccount, // New token account for recipient
              recipientPublicKey,   // Recipient's public key
              mintPublicKey         // Token mint address
            )
          );
          
          console.log("Creating token account stage");
          // Send transaction to create the account
          const signature = await sendTransaction(transaction, connection);
          setStatus(`Creating token account... Transaction sent: ${signature}`);
  
          // Confirm the transaction using TransactionConfirmationStrategy
          const strategy = {
            signature,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
          };

          const confirmation = await connection.confirmTransaction(strategy, 'confirmed');
          if (confirmation.value.err) {
            throw new Error('Token account creation failed');
          }
          setStatus('Token account created successfully!');
        } else {
          throw error; // If the error is not due to the account not being found
        }
      }
  
      // Now that we are sure the recipient has an associated token account,
      // Create the transfer instruction
      const transaction = new Transaction().add(
        createTransferInstruction(
          senderTokenAccount,              // Sender's token account
          recipientTokenAccount,           // Recipient's token account
          publicKey,                       // Sender's public key
          Number(amount)                   // Amount to transfer
        )
      );
  
      // Send transaction and confirm
      const signature = await sendTransaction(transaction, connection);
      setStatus(`Transaction sent: ${signature}`);
  
      // Confirm the transaction using TransactionConfirmationStrategy
      const strategy = {
        signature,
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
      };

      const confirmation = await connection.confirmTransaction(strategy, 'confirmed');
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
      setStatus('Transaction confirmed!');
      resetForm(); // Reset form after successful transaction
    } catch (error) {
      console.error('Transfer failed:', error);
      setStatus(`Error: ${error.message}`);
      resetForm(); // Reset form after failed transaction
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg text-black">
      <h2 className="mb-4 text-xl font-bold text-center text-blue-700">Token Transaction</h2>

      <input
        type="text"
        placeholder="Recipient Address"
        value={recipientAddress}
        onChange={(e) => setRecipientAddress(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />

      <input
        type="text"
        placeholder="Token Mint Address"
        value={tokenMintAddress}
        onChange={(e) => setTokenMintAddress(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />

      <button
        onClick={handleTransfer}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Send Tokens
      </button>

      {status && <p className="mt-4 text-center text-gray-800">{status}</p>}
    </div>
  );
};

export default TokenTransaction;
