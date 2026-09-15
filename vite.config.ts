import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function nimiqDevApiPlugin(): Plugin {
  const TREASURY_PRIVATE_KEY =
    process.env.NIMIQ_TREASURY_KEY ||
    'be10f7a8d866d07a1a5643964c5f740a65a4cbb5f83d0ae48815afea9e30d729';
  const NETWORK_ID = process.env.NIMIQ_NETWORK === 'test' ? 5 : 24;
  const devLeaderboardEntries: any[] = [];

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
                network: NETWORK_ID === 24 ? 'mainnet' : 'testnet',
                faucetUrl: NETWORK_ID === 24 ? `https://nimiq.watch/#${clean}` : 'https://faucet.pos.nimiq-testnet.com',
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

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  txHash: confirmedTxHash,
                  rawHex,
                  broadcasted,
                  treasuryAddress: treasuryAddr.toUserFriendlyAddress(),
                  recipient: clean,
                  amountNim: nimAmount,
                  ticketId,
                  network: NETWORK_ID === 24 ? 'mainnet' : 'testnet',
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        if (url.startsWith('/api/leaderboard')) {
          if (req.method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const type = urlObj.searchParams.get('type');
            const isDaily = type === 'daily';

            const filtered = devLeaderboardEntries
              .filter((e) => (isDaily ? e.isDaily : true))
              .sort((a, b) => b.score - a.score)
              .map((e, idx) => ({
                rank: idx + 1,
                playerAddress: e.playerAddress,
                displayName: e.displayName,
                score: e.score,
                combo: e.combo,
                accuracy: e.accuracy,
                timeSec: e.timeSec,
                rewardNim: e.rewardNim,
                isDaily: e.isDaily,
              }));

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, entries: filtered }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = body ? JSON.parse(body) : {};
                const { playerAddress, displayName, score, combo, accuracy, timeSec, isDaily } = parsed;

                if (!playerAddress || !playerAddress.trim().startsWith('NQ')) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Valid Nimiq address required' }));
                  return;
                }

                const cleanAddress = playerAddress.trim();
                const numScore = Math.max(0, Number(score) || 0);
                const numCombo = Math.max(1, Number(combo) || 1);
                const numAccuracy = Math.min(100, Math.max(0, Number(accuracy) || 100));
                const numTimeSec = Math.max(1, Number(timeSec) || 30);
                const flagDaily = Boolean(isDaily);

                const existingIndex = devLeaderboardEntries.findIndex(
                  (e) => e.playerAddress.replace(/\s+/g, '') === cleanAddress.replace(/\s+/g, '') && e.isDaily === flagDaily
                );

                const rewardNim = numScore > 20000 ? 5.0 : numScore > 10000 ? 2.5 : 1.0;

                if (existingIndex >= 0) {
                  const existing = devLeaderboardEntries[existingIndex];
                  const bestScore = Math.max(existing.score, numScore);
                  const bestCombo = Math.max(existing.combo, numCombo);

                  devLeaderboardEntries[existingIndex] = {
                    ...existing,
                    displayName: displayName || existing.displayName,
                    score: bestScore,
                    combo: bestCombo,
                    accuracy: numAccuracy,
                    timeSec: numTimeSec,
                    rewardNim: bestScore > 20000 ? 5.0 : bestScore > 10000 ? 2.5 : 1.0,
                    updatedAt: Date.now(),
                  };
                } else {
                  devLeaderboardEntries.push({
                    playerAddress: cleanAddress,
                    displayName: displayName || cleanAddress.slice(0, 10),
                    score: numScore,
                    combo: numCombo,
                    accuracy: numAccuracy,
                    timeSec: numTimeSec,
                    rewardNim,
                    isDaily: flagDaily,
                    updatedAt: Date.now(),
                  });
                }

                const filtered = devLeaderboardEntries
                  .filter((e) => (flagDaily ? e.isDaily : true))
                  .sort((a, b) => b.score - a.score)
                  .map((e, idx) => ({
                    rank: idx + 1,
                    playerAddress: e.playerAddress,
                    displayName: e.displayName,
                    score: e.score,
                    combo: e.combo,
                    accuracy: e.accuracy,
                    timeSec: e.timeSec,
                    rewardNim: e.rewardNim,
                    isDaily: e.isDaily,
                  }));

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, entries: filtered }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
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
