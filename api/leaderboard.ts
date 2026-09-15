import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

interface LeaderboardRecord {
  playerAddress: string;
  displayName: string;
  score: number;
  combo: number;
  accuracy: number;
  timeSec: number;
  rewardNim: number;
  isDaily: boolean;
  updatedAt: number;
}

// In-memory cache for warm lambdas
let memoryEntries: LeaderboardRecord[] = [];

const TMP_FILE = path.join('/tmp', 'dynamio_live_leaderboard.json');

function loadStoredEntries(): LeaderboardRecord[] {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore read errors
  }
  return memoryEntries;
}

function persistEntries(entries: LeaderboardRecord[]) {
  memoryEntries = entries;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(entries), 'utf-8');
  } catch {
    // Ignore write errors in read-only environments
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let entries = loadStoredEntries();

  if (req.method === 'GET') {
    const type = req.query.type as string;
    const isDaily = type === 'daily';

    const filtered = entries
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

    return res.status(200).json({
      success: true,
      entries: filtered,
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { playerAddress, displayName, score, combo, accuracy, timeSec, isDaily } = body;

      if (!playerAddress || typeof playerAddress !== 'string' || !playerAddress.trim().startsWith('NQ')) {
        return res.status(400).json({ success: false, error: 'Valid Nimiq address required' });
      }

      const cleanAddress = playerAddress.trim();
      const numScore = Math.max(0, Number(score) || 0);
      const numCombo = Math.max(1, Number(combo) || 1);
      const numAccuracy = Math.min(100, Math.max(0, Number(accuracy) || 100));
      const numTimeSec = Math.max(1, Number(timeSec) || 30);
      const flagDaily = Boolean(isDaily);

      const existingIndex = entries.findIndex(
        (e) => e.playerAddress.replace(/\s+/g, '') === cleanAddress.replace(/\s+/g, '') && e.isDaily === flagDaily
      );

      const rewardNim = numScore > 20000 ? 5.0 : numScore > 10000 ? 2.5 : 1.0;

      if (existingIndex >= 0) {
        // Update if score is higher or refresh stats
        const existing = entries[existingIndex];
        const bestScore = Math.max(existing.score, numScore);
        const bestCombo = Math.max(existing.combo, numCombo);

        entries[existingIndex] = {
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
        entries.push({
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

      persistEntries(entries);

      const filtered = entries
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

      return res.status(200).json({
        success: true,
        entries: filtered,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
