import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
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
  const [amount, setAmount] = useState('10000000000');
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

      // Get the account info for the mint
      const mintAccountInfo = await connection.getAccountInfo(mintPublicKey);
      if (mintAccountInfo === null) {
        throw new Error('Token mint account not found');
      }

      // Check the owner (programId) of the mint account
      const tokenProgramId = mintAccountInfo.owner.toBase58();
      const tokenProgramIdPublicKey = new PublicKey(tokenProgramId);

      // Get the associated token account for the sender
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey,
        false,
        tokenProgramIdPublicKey
      );

      // Check if the recipient's associated token account exists
      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey,
        false,
        tokenProgramIdPublicKey
      );

      const transaction = new Transaction();

      // If the recipient's token account does not exist, create it
      try {
        await getAccount(connection, recipientTokenAccount, false, tokenProgramIdPublicKey);
      } catch (error) {
        console.log("Recipient's token account does not exist");
        if (error instanceof TokenAccountNotFoundError) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // Payer
              recipientTokenAccount, // New token account for recipient
              recipientPublicKey, // Recipient's public key
              mintPublicKey, // Token mint address
              tokenProgramIdPublicKey, // Mint account programId
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        } else {
          throw error; // If the error is not due to the account not being found
        }
      }

      // Add the transfer instruction to the transaction
      transaction.add(
        createTransferInstruction(
          senderTokenAccount, // Sender's token account
          recipientTokenAccount, // Recipient's token account
          publicKey, // Sender's public key
          Number(amount), // Amount to transfer
          [publicKey],
          tokenProgramIdPublicKey
        )
      );

      // Send transaction and confirm
      const signature = await sendTransaction(transaction, connection);
      setStatus(`Transaction sent: ${signature}`);

      // Confirm the transaction
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
      resetForm();
    } catch (error) {
      console.error('Transfer failed:', error);
      setStatus(`Error: ${error.message}`);
      resetForm();
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
