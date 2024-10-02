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
import { toast } from 'react-toastify';

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

  const resetForm = () => {
    setRecipientAddress('');
    setTokenMintAddress('');
    setAmount('');
  };

  const handleTransfer = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet!');
      return;
    }

    // Validate recipient and token mint addresses
    if (!isValidBase58Address(recipientAddress)) {
      toast.error('Invalid recipient address!');
      return;
    }

    if (!isValidBase58Address(tokenMintAddress)) {
      toast.error('Invalid token mint address!');
      return;
    }

    try {
      const recipientPublicKey = new PublicKey(recipientAddress);
      const mintPublicKey = new PublicKey(tokenMintAddress);

      //get the mint account details 
      const mintAccountInfo = await connection.getAccountInfo(mintPublicKey);
      if (mintAccountInfo === null) {
        throw new Error('Token mint account not found');
      }

      const tokenProgramId = mintAccountInfo.owner.toBase58();
      const tokenProgramIdPublicKey = new PublicKey(tokenProgramId); //programId

      //basically PDA concept here
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey,
        false,
        tokenProgramIdPublicKey
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey,
        false,
        tokenProgramIdPublicKey
      );

      const transaction = new Transaction();

      try {
        //try to get the  token account details of recrecipient
        await getAccount(connection, recipientTokenAccount, false, tokenProgramIdPublicKey);
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              recipientTokenAccount,
              recipientPublicKey,
              mintPublicKey,
              tokenProgramIdPublicKey,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
          toast.info(`Recipient account is created`);
        } else {
          throw error;
        }
      }

      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          Number(amount),
          [publicKey],
          tokenProgramIdPublicKey
        )
      );

      const signature = await sendTransaction(transaction, connection);
      toast.info(`Transaction sent: ${signature}`);

      //confirmation strategy using latest blockhash
      const strategy = {
        signature,
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
      };

      const confirmation = await connection.confirmTransaction(strategy, 'confirmed');
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      toast.success('Transaction confirmed!');
      resetForm();
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(`Error: ${error.message}`);
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
    </div>
  );
};

export default TokenTransaction;
