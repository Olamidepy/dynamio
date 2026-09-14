import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Trophy, Medal, Flame } from 'lucide-react';
import { LeaderboardEntry } from '../../game/types';

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerAddress: 'NQ42 9V8B...J2P3', displayName: 'VortexMaster', score: 28450, combo: 8, accuracy: 96, timeSec: 42, rewardNim: 15.0, isDaily: false },
  { rank: 2, playerAddress: 'NQ19 4L0X...7FL4', displayName: 'NimiqArcader', score: 24100, combo: 7, accuracy: 92, timeSec: 48, rewardNim: 10.0, isDaily: false },
  { rank: 3, playerAddress: 'NQ88 1M7A...4KA9', displayName: 'SphereStriker', score: 21950, combo: 6, accuracy: 89, timeSec: 54, rewardNim: 7.5, isDaily: false },
  { rank: 4, playerAddress: 'NQ33 6X1Z...99EE', displayName: 'HyperBeam', score: 18700, combo: 5, accuracy: 94, timeSec: 58, rewardNim: 5.0, isDaily: false },
  { rank: 5, playerAddress: 'NQ71 2P4D...00Q1', displayName: 'ZumaGod', score: 16400, combo: 5, accuracy: 85, timeSec: 65, rewardNim: 3.0, isDaily: false },
];

const MOCK_DAILY_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerAddress: 'NQ19 4L0X...7FL4', displayName: 'NimiqArcader', score: 14850, combo: 6, accuracy: 95, timeSec: 38, rewardNim: 5.0, isDaily: true },
  { rank: 2, playerAddress: 'NQ55 8T2C...11A3', displayName: 'ChronoSphere', score: 13900, combo: 5, accuracy: 91, timeSec: 41, rewardNim: 3.5, isDaily: true },
  { rank: 3, playerAddress: 'NQ42 9V8B...J2P3', displayName: 'VortexMaster', score: 12400, combo: 5, accuracy: 88, timeSec: 44, rewardNim: 2.0, isDaily: true },
  { rank: 4, playerAddress: 'NQ92 3Z9J...55KK', displayName: 'EnergyPulse', score: 11100, combo: 4, accuracy: 86, timeSec: 49, rewardNim: 1.0, isDaily: true },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ open, onOpenChange }) => {
  const [tab, setTab] = useState<'global' | 'daily'>('daily');
  const entries = tab === 'global' ? MOCK_GLOBAL_LEADERBOARD : MOCK_DAILY_LEADERBOARD;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl bg-card text-card-foreground border-border/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFCA1A]/10 border border-[#FFCA1A]/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#FFCA1A]" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl text-foreground">Leaderboards</h2>
            <div className="h-1 w-16 bg-[#FFCA1A] rounded-full mt-1 mb-1.5" />
            <p className="text-xs text-muted-foreground">Validated competitive arcade rankings</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-muted/50 p-1 mb-4 border border-border/40">
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'daily'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Today's Trial</span>
          </button>

          <button
            onClick={() => setTab('global')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'global'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Medal className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>All-Time Masters</span>
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl overflow-hidden border border-border/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] border-b border-border/40">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Player</th>
                <th className="p-3 text-right">Score</th>
                <th className="p-3 text-right">Combo</th>
                <th className="p-3 text-right">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {entries.map((entry) => (
                <tr key={entry.rank} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-heading font-bold text-foreground flex items-center space-x-1.5">
                    {entry.rank === 1 && <span>🥇</span>}
                    {entry.rank === 2 && <span>🥈</span>}
                    {entry.rank === 3 && <span>🥉</span>}
                    <span>#{entry.rank}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-foreground block">{entry.displayName}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{entry.playerAddress}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-foreground">
                    {entry.score.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-medium text-[#FFCA1A]">
                    {entry.combo}x
                  </td>
                  <td className="p-3 text-right font-bold text-[#FFCA1A]">
                    {entry.rewardNim} NIM
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
