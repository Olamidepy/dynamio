import { LeaderboardEntry } from '../../game/types';
import { NimiqProfileService } from './NimiqProfileService';

const STORAGE_KEY = 'dynamio_live_devices_v1';

export class LeaderboardService {
  private static localCache: LeaderboardEntry[] = [];

  static getLocalCache(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  }

  static saveLocalCache(entries: LeaderboardEntry[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Fetch live leaderboard from API with local fallback
   */
  static async fetchLeaderboard(type: 'daily' | 'global'): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch(`/api/leaderboard?type=${type}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.entries)) {
          // Merge into local cache
          const existing = this.getLocalCache();
          const map = new Map<string, LeaderboardEntry>();
          existing.forEach((e) => map.set(`${e.playerAddress}_${e.isDaily}`, e));
          data.entries.forEach((e: LeaderboardEntry) => map.set(`${e.playerAddress}_${e.isDaily}`, e));
          const merged = Array.from(map.values());
          this.saveLocalCache(merged);
          return data.entries;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote leaderboard, using local live cache:', err);
    }

    // Fallback to local cache filtered by type
    const isDaily = type === 'daily';
    const local = this.getLocalCache()
      .filter((e) => (isDaily ? e.isDaily : true))
      .sort((a, b) => b.score - a.score)
      .map((e, idx) => ({ ...e, rank: idx + 1 }));
    return local;
  }

  /**
   * Submit or update a live connected device score
   */
  static async submitScore(entry: {
    playerAddress: string;
    displayName?: string;
    score: number;
    combo?: number;
    accuracy?: number;
    timeSec?: number;
    isDaily?: boolean;
  }): Promise<LeaderboardEntry[]> {
    if (!entry.playerAddress || !entry.playerAddress.startsWith('NQ')) {
      return [];
    }

    const profile = NimiqProfileService.getProfile(entry.playerAddress, entry.displayName);
    const payload = {
      playerAddress: entry.playerAddress,
      displayName: entry.displayName || profile.label,
      score: entry.score || 0,
      combo: entry.combo || 1,
      accuracy: entry.accuracy || 100,
      timeSec: entry.timeSec || 30,
      isDaily: !!entry.isDaily,
    };

    // Update local cache immediately
    const existing = this.getLocalCache();
    const key = `${payload.playerAddress}_${payload.isDaily}`;
    const map = new Map<string, LeaderboardEntry>();
    existing.forEach((e) => map.set(`${e.playerAddress}_${e.isDaily}`, e));

    const current = map.get(key);
    const finalScore = current ? Math.max(current.score, payload.score) : payload.score;
    const finalCombo = current ? Math.max(current.combo, payload.combo) : payload.combo;

    const updatedEntry: LeaderboardEntry = {
      rank: 1,
      playerAddress: payload.playerAddress,
      displayName: payload.displayName,
      score: finalScore,
      combo: finalCombo,
      accuracy: payload.accuracy,
      timeSec: payload.timeSec,
      rewardNim: finalScore > 20000 ? 5.0 : finalScore > 10000 ? 2.5 : 1.0,
      isDaily: payload.isDaily,
    };

    map.set(key, updatedEntry);
    const sorted = Array.from(map.values())
      .filter((e) => (payload.isDaily ? e.isDaily : true))
      .sort((a, b) => b.score - a.score)
      .map((e, idx) => ({ ...e, rank: idx + 1 }));

    this.saveLocalCache(Array.from(map.values()));

    // Submit to server API
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.entries)) {
          return data.entries;
        }
      }
    } catch (err) {
      console.warn('Failed to sync score to server:', err);
    }

    return sorted;
  }
}
