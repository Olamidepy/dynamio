import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function nimiqDevApiPlugin(): Plugin {
  const TREASURY_PRIVATE_KEY =
    process.env.NIMIQ_TREASURY_KEY ||
    'be10f7a8d866d07a1a5643964c5f740a65a4cbb5f83d0ae48815afea9e30d729';
  const NETWORK_ID = process.env.NIMIQ_NETWORK === 'test' ? 5 : 42;

  return {
    name: 'nimiq-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (url.startsWith('/api/treasury')) {
          try {
            const Nimiq = await import('@nimiq/core');
            const privateKey = Nimiq.PrivateKey.fromHex(TREASURY_PRIVATE_KEY);
            const keyPair = Nimiq.KeyPair.derive(privateKey);
            const address = keyPair.publicKey.toAddress().toUserFriendlyAddress();
            const clean = address.replace(/\s+/g, '');

            let balance = 0;
            try {
              const fetchRes = await fetch(`https://api.nimiq.watch/account/${clean}`);
              if (fetchRes.ok) {
                const data = (await fetchRes.json()) as any;
                if (typeof data.balance === 'number') balance = data.balance / 1e5;
              }
            } catch {}

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                address,
                balanceNim: balance,
                network: NETWORK_ID === 42 ? 'mainnet' : 'testnet',
                faucetUrl: 'https://faucet.pos.nimiq-testnet.com',
              })
            );
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
            return;
          }
        }

        if (url.startsWith('/api/claim-reward') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const { recipient, amount, ticketId, blockNumber } = parsed;

              if (!recipient) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Missing recipient' }));
                return;
              }

              const clean = recipient.replace(/\s+/g, '').toUpperCase();
              const nimAmount = Number(amount) || 1.0;
              const lunas = BigInt(Math.round(nimAmount * 1e5));

              const Nimiq = await import('@nimiq/core');
              const privateKey = Nimiq.PrivateKey.fromHex(TREASURY_PRIVATE_KEY);
              const keyPair = Nimiq.KeyPair.derive(privateKey);
              const treasuryAddr = keyPair.publicKey.toAddress();
              const recipientAddr = Nimiq.Address.fromUserFriendlyAddress(clean);

              let validityHeight =
                typeof blockNumber === 'number' && blockNumber > 0 ? blockNumber : 0;
              if (!validityHeight) {
                try {
                  const blkRes = await fetch('https://rpc.nimiqwatch.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'getBlockNumber', params: [], id: 1 }),
                  });
                  if (blkRes.ok) {
                    const blkData = (await blkRes.json()) as any;
                    validityHeight = blkData.result?.data || blkData.result || 61630272;
                  }
                } catch {
                  validityHeight = 61630272;
                }
              }

              const tx = Nimiq.TransactionBuilder.newBasic(
                treasuryAddr,
                recipientAddr,
                lunas,
                BigInt(0),
                validityHeight,
                NETWORK_ID
              );
              tx.sign(keyPair);

              const txHash = tx.hash();
              const rawHex = tx.toHex();

              let broadcasted = false;
              try {
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
                if (rpcRes.ok) {
                  const json = (await rpcRes.json()) as any;
                  if (json.result) {
                    broadcasted = true;
                  }
                }
              } catch (broadcastErr) {
                console.warn('Direct broadcast error in dev server:', broadcastErr);
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  txHash,
                  rawHex,
                  broadcasted,
                  treasuryAddress: treasuryAddr.toUserFriendlyAddress(),
                  recipient: clean,
                  amountNim: nimAmount,
                  ticketId,
                  network: NETWORK_ID === 42 ? 'mainnet' : 'testnet',
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), nimiqDevApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
