import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as Nimiq from '@nimiq/core';

// Dynamio Game Treasury Config
// Mainnet Treasury Address: NQ81 BDH4 RKPV XMG3 T082 J84R QRPT VJEJ FUET
const TREASURY_PRIVATE_KEY =
  process.env.NIMIQ_TREASURY_KEY ||
  'be10f7a8d866d07a1a5643964c5f740a65a4cbb5f83d0ae48815afea9e30d729';

// Network ID: 24 = MainAlbatross (Mainnet 2.0), 5 = TestAlbatross (Testnet 2.0)
const NETWORK_ID = process.env.NIMIQ_NETWORK === 'test' ? 5 : 24;

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

    // 2. Fetch live block height from Nimiq Mainnet 2.0 node
    let validityHeight = 0;
    try {
      const blkRes = await fetch('https://rpc.nimiqwatch.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'getBlockNumber', params: [], id: 1 }),
      });
      if (blkRes.ok) {
        const blkData = (await blkRes.json()) as any;
        const currentBlock =
          typeof blkData.result?.data === 'number'
            ? blkData.result.data
            : typeof blkData.result === 'number'
            ? blkData.result
            : 0;
        if (currentBlock > 0) {
          validityHeight = currentBlock - 2;
        }
      }
    } catch {}

    if (!validityHeight) {
      validityHeight = typeof blockNumber === 'number' && blockNumber > 0 ? blockNumber : 61636600;
    }

    // 3. Build & sign transaction
    const tx = Nimiq.TransactionBuilder.newBasic(
      treasuryAddress,
      recipientAddress,
      lunas,
      BigInt(0), // 0 fee for Nimiq PoS
      validityHeight,
      NETWORK_ID
    );

    tx.sign(keyPair);

    const txHash = tx.hash();
    const rawHex = tx.toHex();

    // 4. Broadcast on live Nimiq network via RPC
    let broadcasted = false;
    let confirmedTxHash = tx.hash();

    const rpcRes = await fetch('https://rpc.nimiqwatch.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'sendRawTransaction',
        params: [rawHex],
        id: 1,
      }),
    });

    if (!rpcRes.ok) {
      throw new Error(`Nimiq RPC HTTP ${rpcRes.status}: ${rpcRes.statusText}`);
    }

    const json = (await rpcRes.json()) as any;
    if (json.error) {
      const errMsg = json.error.data || json.error.message || 'Transaction rejected by Nimiq network';
      throw new Error(`RPC Error: ${errMsg}`);
    }

    if (json.result && json.result.data) {
      broadcasted = true;
      confirmedTxHash = json.result.data;
    } else {
      throw new Error('Nimiq RPC did not return a confirmed transaction hash');
    }

    return res.status(200).json({
      success: true,
      txHash: confirmedTxHash,
      rawHex,
      broadcasted,
      treasuryAddress: treasuryAddress.toUserFriendlyAddress(),
      recipient: cleanRecipient,
      amountNim: nimAmount,
      ticketId,
      network: NETWORK_ID === 24 ? 'mainnet' : 'testnet',
    });
  } catch (error: any) {
    console.error('Error claiming NIM reward:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing NIM reward',
    });
  }
}
