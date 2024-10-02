import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

const TOKEN_PROGRAM_IDS = [
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Custom Token Program ID (22)
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'  // Default Token Program ID
];

// Function to get token accounts from both program IDs
export const getTokenAccounts = async (walletAddress) => {
  const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/D2scTsXfiMJgmjkqvigvkwNCwc565itt');

  let publicKey;
  try {
    publicKey = new PublicKey(walletAddress);
  } catch (error) {
    console.error("Invalid wallet address:", error);
    return [];
  }

  const tokenAccountsResults = [];

  try {
    for (const programId of TOKEN_PROGRAM_IDS) {
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: new PublicKey(programId),
          }
        );

        tokenAccounts.value.forEach((accountInfo) => {
          const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;
          const mintAddress = accountInfo.account.data.parsed.info.mint;
          tokenAccountsResults.push({ programId, mintAddress, tokenAmount });
        });
        
      } catch (error) {
        console.error(`Error with program ID ${programId}:`, error);
      }
    }

    return tokenAccountsResults;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    return [];
  }
};

export default function AllTokens() {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const tokensList = await getTokenAccounts(publicKey.toString());
      setTokens(tokensList);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [publicKey]);

  if (loading) {
    return <p className="text-gray-600">Loading tokens...</p>;
  }

  if (!tokens.length) {
    return <p className="text-gray-600">No tokens found.</p>;
  }

  return (
    <div className="mt-1">
      <h3 className="font-semibold mb-2 text-black">Your Tokens</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-indigo-700">
          <tr>
            <th className="px-4 py-2 text-left">Mint Address</th>
            <th className="px-4 py-2 text-left">Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tokens.map((token, index) => (
            <tr key={index} className={`hover:bg-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <td className="px-4 py-2 text-gray-800">{token.mintAddress}</td>
              <td className="px-4 py-2 text-gray-800">{token.tokenAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
