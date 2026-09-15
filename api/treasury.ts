import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as Nimiq from '@nimiq/core';

const TREASURY_PRIVATE_KEY =
  process.env.NIMIQ_TREASURY_KEY ||
  '59e88e7246985d71045c0eb328e3c7f8208e99269999cd025d422db7dc35c1ae';

const NETWORK_ID = process.env.NIMIQ_NETWORK === 'main' ? 42 : 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const privateKey = Nimiq.PrivateKey.fromHex(TREASURY_PRIVATE_KEY);
    const keyPair = Nimiq.KeyPair.derive(privateKey);
    const address = keyPair.publicKey.toAddress().toUserFriendlyAddress();
    const cleanAddress = address.replace(/\s+/g, '');

    // Query on-chain balance
    let balance = 0;
    try {
      const apiRes = await fetch(`https://api.nimiq.watch/account/${cleanAddress}`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (typeof data.balance === 'number') {
          balance = data.balance / 1e5;
        }
      }
    } catch {
      // Offline fallback
    }

    return res.status(200).json({
      success: true,
      address,
      balanceNim: balance,
      network: NETWORK_ID === 42 ? 'mainnet' : 'testnet',
      faucetUrl: 'https://faucet.pos.nimiq-testnet.com',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
