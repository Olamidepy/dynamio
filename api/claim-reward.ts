import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as Nimiq from '@nimiq/core';

// Dynamio Game Treasury Config
// Mainnet Treasury Address: NQ81 BDH4 RKPV XMG3 T082 J84R QRPT VJEJ FUET
const TREASURY_PRIVATE_KEY =
  process.env.NIMIQ_TREASURY_KEY ||
  'be10f7a8d866d07a1a5643964c5f740a65a4cbb5f83d0ae48815afea9e30d729';

// Network ID: 42 = MainAlbatross (Mainnet), 5 = TestAlbatross (Testnet)
const NETWORK_ID = process.env.NIMIQ_NETWORK === 'test' ? 5 : 42;

interface ClaimRequestBody {
  recipient: string;
  amount: number; // In NIM (e.g. 1.0)
  ticketId?: string;
  blockNumber?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { recipient, amount, ticketId, blockNumber } = req.body as ClaimRequestBody;

    if (!recipient || typeof recipient !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid recipient address' });
    }

    const cleanRecipient = recipient.replace(/\s+/g, '').toUpperCase();
    if (!cleanRecipient.startsWith('NQ')) {
      return res.status(400).json({ success: false, error: 'Invalid Nimiq recipient format' });
    }

    const nimAmount = Number(amount) || 1.0;
    const lunas = BigInt(Math.round(nimAmount * 1e5)); // 1 NIM = 100,000 Luna

    // 1. Initialize Treasury KeyPair
    const privateKey = Nimiq.PrivateKey.fromHex(TREASURY_PRIVATE_KEY);
    const keyPair = Nimiq.KeyPair.derive(privateKey);
    const treasuryAddress = keyPair.publicKey.toAddress();
    const recipientAddress = Nimiq.Address.fromUserFriendlyAddress(cleanRecipient);

    // 2. Validity start height (defaults to current block estimate if not provided by client)
    const validityHeight = typeof blockNumber === 'number' && blockNumber > 0 ? blockNumber : 1000;

    // 3. Build & sign transaction
    const tx = Nimiq.TransactionBuilder.newBasic(
      treasuryAddress,
      recipientAddress,
      lunas,
      BigInt(0), // 0 fee for Testnet
      validityHeight,
      NETWORK_ID
    );

    tx.sign(keyPair);

    const txHash = tx.hash();
    const rawHex = tx.toHex();

    // 4. Broadcast attempt to RPC nodes if available
    const rpcUrls = [
      process.env.NIMIQ_RPC_URL,
      'http://127.0.0.1:8648',
      'https://rpc.nimiqwatch.com',
    ].filter(Boolean) as string[];

    let broadcasted = false;
    for (const rpcUrl of rpcUrls) {
      try {
        const rpcRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'sendRawTransaction',
            params: [rawHex],
            id: 1,
          }),
        });
        if (rpcRes.ok) {
          const json = await rpcRes.json();
          if (json.result) {
            broadcasted = true;
            break;
          }
        }
      } catch {
        // Continue to fallback
      }
    }

    return res.status(200).json({
      success: true,
      txHash,
      rawHex,
      broadcasted,
      treasuryAddress: treasuryAddress.toUserFriendlyAddress(),
      recipient: cleanRecipient,
      amountNim: nimAmount,
      ticketId,
      network: NETWORK_ID === 42 ? 'mainnet' : 'testnet',
    });
  } catch (error: any) {
    console.error('Error claiming NIM reward:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing NIM reward',
    });
  }
}
