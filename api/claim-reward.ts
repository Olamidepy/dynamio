import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as Nimiq from '@nimiq/core';

// Dynamio Game Treasury Config
// Default pre-funded testnet treasury address: NQ07 B790 1DP1 PPQK 2P0Y JXYP QKBT 1H95 P90S
const TREASURY_PRIVATE_KEY =
  process.env.NIMIQ_TREASURY_KEY ||
  '59e88e7246985d71045c0eb328e3c7f8208e99269999cd025d422db7dc35c1ae';

// Network ID: 5 = TestAlbatross (Testnet), 42 = MainAlbatross (Mainnet)
const NETWORK_ID = process.env.NIMIQ_NETWORK === 'main' ? 42 : 5;

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

    const rawAmount = Number(amount) || 0.1;
    // Cap testnet payouts to 0.1 NIM so Treasury balance supports multiple test sessions
    const nimAmount = NETWORK_ID === 5 ? Math.min(rawAmount, 0.1) : rawAmount;
    const lunas = BigInt(Math.max(1000, Math.round(nimAmount * 1e5))); // Minimum 1,000 Luna

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
