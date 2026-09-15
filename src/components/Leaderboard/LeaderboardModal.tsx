import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Trophy, Medal, Flame, Radio, RefreshCw } from 'lucide-react';
import { LeaderboardEntry } from '../../game/types';
import { NimiqWalletService, NimiqWalletAccount } from '../../lib/nimiq/NimiqWalletService';
import { NimiqProfileService } from '../../lib/nimiq/NimiqProfileService';
import { StorageService } from '../../lib/persistence/StorageService';
import { LeaderboardService } from '../../lib/nimiq/LeaderboardService';
import { NimiqIdenticon } from '../ui/NimiqIdenticon';

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ open, onOpenChange }) => {
  const [tab, setTab] = useState<'daily' | 'global'>('daily');
  const [account, setAccount] = useState<NimiqWalletAccount>(NimiqWalletService.getInstance().getAccount());
  const [userScore, setUserScore] = useState<number>(0);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsub = NimiqWalletService.getInstance().subscribe(setAccount);
    return unsub;
  }, []);

  useEffect(() => {
    if (open) {
      const progress = StorageService.getProgress();
      const highest = Object.values(progress.highScores || {}).reduce((max, s) => Math.max(max, s), 0);
      setUserScore(highest);
    }
  }, [open]);

  // Calculate user profile details
  const isUserConnected = Boolean(account.isConnected && account.address && account.address.startsWith('NQ'));
  const userAddress = isUserConnected ? account.formattedAddress : '';
  const userProfile = isUserConnected ? NimiqProfileService.getProfile(account.address, account.label) : null;
  const userDisplayName = isUserConnected ? (account.label || userProfile?.label || 'Your Account') : 'Guest Contender';
  const userMoniker = isUserConnected ? (account.moniker || userProfile?.moniker || '') : '';

  const loadLiveLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // If user is connected and has a record, sync live
      if (isUserConnected && userAddress) {
        await LeaderboardService.submitScore({
          playerAddress: userAddress,
          displayName: userDisplayName,
          score: userScore,
          isDaily: tab === 'daily',
        });
      }

      const liveList = await LeaderboardService.fetchLeaderboard(tab);
      setEntries(liveList);
    } catch (err) {
      console.warn('Failed to load live leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tab, isUserConnected, userAddress, userDisplayName, userScore]);

  useEffect(() => {
    if (open) {
      loadLiveLeaderboard();
    }
  }, [open, tab, loadLiveLeaderboard]);

  // Combine user entry if connected and not yet in list
  let combined = [...entries];
  if (isUserConnected && userAddress) {
    const cleanUser = userAddress.replace(/\s+/g, '');
    const alreadyListed = combined.some((e) => e.playerAddress.replace(/\s+/g, '') === cleanUser);
    if (!alreadyListed) {
      combined.push({
        rank: 1,
        playerAddress: userAddress,
        displayName: userDisplayName,
        score: userScore,
        combo: 1,
        accuracy: 100,
        timeSec: 30,
        rewardNim: userScore > 20000 ? 5.0 : userScore > 10000 ? 2.5 : 1.0,
        isDaily: tab === 'daily',
      });
    }
  }

  // Sort strictly by score and assign ranks
  const rankedEntries: LeaderboardEntry[] = combined
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

  const cleanUserAddr = userAddress.replace(/\s+/g, '');
  const currentUserRank = isUserConnected
    ? (rankedEntries.find((e) => e.playerAddress.replace(/\s+/g, '') === cleanUserAddr)?.rank || 1)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl bg-card text-card-foreground border-border/60 p-6 sm:p-8 space-y-5">
        {/* Header with yellow accent line */}
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Hall of Champions
                </DialogTitle>
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Real-time rankings from live connected devices only
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadLiveLeaderboard}
                disabled={isLoading}
                title="Refresh Live Rankings"
                className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FFCA1A]' : ''}`} />
              </button>
              <Trophy className="w-6 h-6 text-[#FFCA1A]" />
            </div>
          </div>
          {/* Yellow thin line at the bottom of header text */}
          <div className="h-[2px] w-full bg-[#FFCA1A] mt-2 rounded-full" />
        </DialogHeader>

        {/* 🌟 Current Player Standing Card with Nimiq PFP & Scraped Name */}
        {isUserConnected ? (
          <div className="rounded-xl border border-[#FFCA1A]/40 bg-[#FFCA1A]/5 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Nimiq Wallet Identicon PFP */}
              <NimiqIdenticon address={userAddress} size={44} showBorder />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-foreground truncate">
                    {userDisplayName}
                  </span>
                  {currentUserRank && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFCA1A]/20 text-[#FFCA1A] border border-[#FFCA1A]/30 shrink-0">
                      Rank #{currentUserRank}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {userMoniker && (
                    <span className="text-[10px] text-primary font-medium truncate">
                      {userMoniker}
                    </span>
                  )}
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    {userAddress.slice(0, 19)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Dyno Score
              </span>
              <span className="font-heading font-extrabold text-base sm:text-lg text-primary block">
                {userScore.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-semibold text-xs text-foreground block">
                Wallet Not Connected
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Connect your Nimiq wallet to register your device on the live leaderboard.
              </p>
            </div>
            <button
              onClick={() => NimiqWalletService.getInstance().connect().catch(() => {})}
              className="px-3 py-1.5 rounded-lg bg-[#FFCA1A] text-black font-bold text-xs shrink-0 hover:bg-[#FFCA1A]/90 transition-colors cursor-pointer"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-lg bg-muted p-1 border border-border/40">
          <button
            onClick={() => setTab('daily')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
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
            className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              tab === 'global'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Medal className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>All-Time Masters</span>
          </button>
        </div>

        {/* Leaderboard Content */}
        {rankedEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFCA1A]/10 border border-[#FFCA1A]/20 flex items-center justify-center relative">
              <Radio className="w-6 h-6 text-[#FFCA1A] animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-foreground">
                Awaiting Live Contenders
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                No connected devices recorded yet for this category. Connect your Nimiq wallet or play a round to take the #1 spot!
              </p>
            </div>
            {!isUserConnected && (
              <button
                onClick={() => NimiqWalletService.getInstance().connect().catch(() => {})}
                className="px-4 py-2 rounded-lg bg-[#FFCA1A] text-black font-bold text-xs hover:bg-[#FFCA1A]/90 transition-colors shadow-sm cursor-pointer"
              >
                Connect Wallet Now
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] border-b border-border/40">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Connected Player & PFP</th>
                  <th className="p-3 text-right">Dyno Score</th>
                  <th className="p-3 text-right">Combo</th>
                  <th className="p-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rankedEntries.map((entry) => {
                  const isUser = isUserConnected && entry.playerAddress.replace(/\s+/g, '') === cleanUserAddr;
                  return (
                    <tr
                      key={entry.playerAddress + entry.rank}
                      className={`transition-colors ${
                        isUser
                          ? 'bg-primary/10 font-medium'
                          : 'hover:bg-muted/20'
                      }`}
                    >
                      <td className="p-3 font-heading font-bold text-foreground">
                        <div className="flex items-center space-x-1">
                          {entry.rank === 1 && <span>🥇</span>}
                          {entry.rank === 2 && <span>🥈</span>}
                          {entry.rank === 3 && <span>🥉</span>}
                          <span>#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          {/* Nimiq Wallet Identicon PFP for every real connected player */}
                          <NimiqIdenticon address={entry.playerAddress} size={32} showBorder={isUser} />
                          <div className="min-w-0">
                            <span className={`font-semibold text-foreground block truncate ${isUser ? 'text-[#FFCA1A]' : ''}`}>
                              {entry.displayName} {isUser && '(You)'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground truncate block">
                              {entry.playerAddress.slice(0, 19)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium text-primary">
                        {entry.combo}x
                      </td>
                      <td className="p-3 text-right font-bold text-[#00875a]">
                        +{entry.rewardNim.toFixed(1)} NIM
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
