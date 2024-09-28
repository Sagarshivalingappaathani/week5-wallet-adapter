import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';

export default function AllTokens() {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/D2scTsXfiMJgmjkqvigvkwNCwc565itt');

  const fetchTokens =async () => {
    if (!publicKey) return;

    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokensList = await Promise.all(
        tokenAccounts.value.map(async (tokenAccount) => {
          const accountInfo = await getAccount(connection, tokenAccount.pubkey);
          const tokenMint = tokenAccount.account.data.parsed.info.mint;
          const tokenAmount = accountInfo.amount.toString();
          const mintAddress = new PublicKey(tokenMint);

          return {
            mintAddress: mintAddress.toString(),
            amount: tokenAmount / 1000000000, // Adjust for decimals
          };
        })
      );

      setTokens(tokensList);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  } 

  useEffect(() => {
    fetchTokens(); 
  }, [fetchTokens]); 

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
            <th className="px-4 py-2 text-left">Token Mint Address</th>
            <th className="px-4 py-2 text-left">Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tokens.map((token, index) => (
            <tr key={index} className={`hover:bg-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <td className="px-4 py-2 text-gray-800">{token.mintAddress}</td>
              <td className="px-4 py-2 text-gray-800">{token.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
