import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Swords,
  Trophy,
  Zap,
  Lock,
  Globe,
  Share2,
  Check,
  ChevronRight,
  Sparkles,
  Users,
  Coins,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { LEVELS } from '../../game/data/levels';
import { LevelConfig } from '../../game/types';
import { NimiqWalletAccount, NimiqWalletService } from '../../lib/nimiq/NimiqWalletService';

interface ChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: NimiqWalletAccount;
  onStartChallengeMatch: (level: LevelConfig, entryFee: number) => void;
  onConnectWallet: () => void;
}

interface OpenChallenge {
  id: string;
  creator: string;
  levelId: number;
  entryFee: number;
  pool: number;
  joinedCount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

const RECENT_WINNERS = [
  { player: '@NimiqKing', amount: 30.0, level: 'Amber Spiral', time: '12m ago' },
  { player: '@ChainMaster', amount: 17.0, level: 'Cobalt S-Bend', time: '28m ago' },
  { player: '@ZumaWizard', amount: 10.0, level: 'Neon Gateway', time: '1h ago' },
  { player: '@VortexHunter', amount: 45.0, level: 'Quantum Vortex', time: '2h ago' },
  { player: '@Solaris', amount: 30.0, level: 'Solar Flare', time: '3h ago' },
];

const INITIAL_OPEN_CHALLENGES: OpenChallenge[] = [
  {
    id: 'chall_amber_20',
    creator: 'NQ72...89AB',
    levelId: 2,
    entryFee: 20,
    pool: 60,
    joinedCount: 2,
    maxPlayers: 3,
    isPrivate: false,
  },
  {
    id: 'chall_neon_10',
    creator: 'NQ33...11FF',
    levelId: 1,
    entryFee: 10,
    pool: 30,
    joinedCount: 1,
    maxPlayers: 3,
    isPrivate: false,
  },
  {
    id: 'chall_cobalt_20',
    creator: 'NQ91...44DD',
    levelId: 3,
    entryFee: 20,
    pool: 60,
    joinedCount: 2,
    maxPlayers: 3,
    isPrivate: false,
  },
];

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  open,
  onOpenChange,
  wallet,
  onStartChallengeMatch,
  onConnectWallet,
}) => {
  const [selectedEntryFee, setSelectedEntryFee] = useState<number>(20);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(2);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [openChallenges, setOpenChallenges] = useState<OpenChallenge[]>(INITIAL_OPEN_CHALLENGES);
  const [myMatches, setMyMatches] = useState<OpenChallenge[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pool breakdown for 3 players
  const totalPool = selectedEntryFee * 3;
  const firstPrize = Math.round(totalPool * 0.5); // 50% = 30 NIM for 60
  const secondPrize = Math.round(totalPool * 0.283); // 28.3% = 17 NIM for 60
  const thirdPrize = Math.round(totalPool * 0.167); // 16.7% = 10 NIM for 60
  const burnFee = totalPool - (firstPrize + secondPrize + thirdPrize); // 3 NIM

  const handleCreateChallenge = async () => {
    if (!wallet.isConnected) {
      onConnectWallet();
      return;
    }

    if (wallet.balanceNim < selectedEntryFee) {
      alert(`Insufficient NIM balance (${wallet.balanceNim.toFixed(1)} NIM). Need ${selectedEntryFee} NIM.`);
      return;
    }

    // Deduct entry fee
    await NimiqWalletService.getInstance().sendTransaction('NQ_ESCROW_CHALLENGE_POOL', selectedEntryFee);

    const newChall: OpenChallenge = {
      id: `chall_${Date.now()}`,
      creator: wallet.address ? `${wallet.address.substring(0, 4)}...${wallet.address.slice(-4)}` : 'You',
      levelId: selectedLevelId,
      entryFee: selectedEntryFee,
      pool: totalPool,
      joinedCount: 1,
      maxPlayers: 3,
      isPrivate,
    };

    if (!isPrivate) {
      setOpenChallenges([newChall, ...openChallenges]);
    }
    setMyMatches([newChall, ...myMatches]);

    // Launch match
    const targetLvl = LEVELS.find((l) => l.id === selectedLevelId) || LEVELS[1];
    onOpenChange(false);
    onStartChallengeMatch(targetLvl, selectedEntryFee);
  };

  const handleJoinChallenge = async (challenge: OpenChallenge) => {
    if (!wallet.isConnected) {
      onConnectWallet();
      return;
    }

    if (wallet.balanceNim < challenge.entryFee) {
      alert(`Insufficient NIM balance. Need ${challenge.entryFee} NIM to join.`);
      return;
    }

    await NimiqWalletService.getInstance().sendTransaction('NQ_ESCROW_CHALLENGE_POOL', challenge.entryFee);

    const targetLvl = LEVELS.find((l) => l.id === challenge.levelId) || LEVELS[0];
    onOpenChange(false);
    onStartChallengeMatch(targetLvl, challenge.entryFee);
  };

  const handleCopyInvite = (challId: string) => {
    const inviteUrl = `${window.location.origin}/?challenge=${challId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(challId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl text-left bg-card text-card-foreground border-border/60 p-4 sm:p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFCA1A]/10 border border-[#FFCA1A]/30 flex items-center justify-center">
              <Swords className="w-5 h-5 text-[#FFCA1A]" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-foreground flex items-center gap-1.5">
                VS Challenges
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Compete on identical track seeds for real NIM prize pools.
              </p>
            </div>
          </div>
        </div>

        {/* 🏆 Motivation Ticker: Recent Winners */}
        <div className="my-3 bg-muted/40 p-2.5 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] uppercase font-bold text-[#FFCA1A] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#FFCA1A]" />
              <span>Recent Champions & Payouts</span>
            </span>
            <span className="text-[9px] text-muted-foreground">Live Feed</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {RECENT_WINNERS.map((win, idx) => (
              <div
                key={idx}
                className="shrink-0 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-border/60 flex items-center space-x-1.5 text-xs shadow-xs"
              >
                <span className="font-bold text-foreground text-[11px]">{win.player}</span>
                <span className="text-[10px] text-muted-foreground">won</span>
                <span className="font-heading font-extrabold text-[#FFCA1A] text-[11px]">
                  +{win.amount.toFixed(0)} NIM
                </span>
                <span className="text-[9px] text-muted-foreground">({win.level})</span>
              </div>
            ))}
          </div>
        </div>

        {/* ⚡ 1. Create a Challenge Card */}
        <div className="bg-muted/30 p-3.5 sm:p-4 rounded-xl border border-border/50 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#FFCA1A]" />
              <span>Create a Challenge</span>
            </span>
            <Badge variant="outline" className="text-[10px] text-[#FFCA1A] border-[#FFCA1A]/30">
              3-Player Arena
            </Badge>
          </div>

          {/* Level Selection */}
          <div>
            <label className="text-[10px] sm:text-[11px] uppercase font-semibold text-muted-foreground block mb-1">
              Select Arena Track
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {LEVELS.slice(0, 4).map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevelId(lvl.id)}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                    selectedLevelId === lvl.id
                      ? 'border-[#FFCA1A] bg-[#FFCA1A]/10 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="truncate text-[11px]">{lvl.name}</div>
                  <div className="text-[9px] text-muted-foreground">Lvl {lvl.id}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entry Fee Selection */}
          <div>
            <label className="text-[10px] sm:text-[11px] uppercase font-semibold text-muted-foreground block mb-1">
              NIM Entry Fee
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((fee) => (
                <button
                  key={fee}
                  onClick={() => setSelectedEntryFee(fee)}
                  className={`py-2 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    selectedEntryFee === fee
                      ? 'border-[#FFCA1A] bg-[#FFCA1A] text-black shadow-md shadow-[#FFCA1A]/20'
                      : 'border-border/60 text-foreground bg-background/60 hover:bg-accent'
                  }`}
                >
                  {fee} NIM
                </button>
              ))}
            </div>
          </div>

          {/* Prize Distribution Breakdown */}
          <div className="bg-background/70 p-2.5 rounded-xl border border-border/40 text-xs space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-foreground pb-1 border-b border-border/30">
              <span>Prize Pool ({totalPool} NIM Total)</span>
              <span className="text-[#FFCA1A]">Top 3 Share</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
              <div className="bg-muted/40 p-1.5 rounded-lg">
                <span className="text-[9px] text-muted-foreground block">🥇 1st Place</span>
                <span className="font-heading font-extrabold text-[#FFCA1A] text-xs sm:text-sm">
                  {firstPrize} NIM
                </span>
                <span className="text-[8px] text-muted-foreground block">(50%)</span>
              </div>
              <div className="bg-muted/40 p-1.5 rounded-lg">
                <span className="text-[9px] text-muted-foreground block">🥈 2nd Place</span>
                <span className="font-heading font-extrabold text-foreground text-xs sm:text-sm">
                  {secondPrize} NIM
                </span>
                <span className="text-[8px] text-muted-foreground block">(28%)</span>
              </div>
              <div className="bg-muted/40 p-1.5 rounded-lg">
                <span className="text-[9px] text-muted-foreground block">🥉 3rd Place</span>
                <span className="font-heading font-extrabold text-muted-foreground text-xs sm:text-sm">
                  {thirdPrize} NIM
                </span>
                <span className="text-[8px] text-muted-foreground block">(17%)</span>
              </div>
            </div>
          </div>

          {/* Private Match Toggle */}
          <div className="flex items-center justify-between py-1 px-1">
            <div className="flex items-center space-x-2">
              {isPrivate ? (
                <Lock className="w-3.5 h-3.5 text-[#FFCA1A]" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-foreground font-medium">
                {isPrivate ? 'Private Challenge' : 'Public Challenge'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({isPrivate ? 'Invite link only' : 'Listed in Open Challenges'})
              </span>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${
                isPrivate ? 'bg-[#FFCA1A] justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-black shadow-sm" />
            </button>
          </div>

          {/* Action Button */}
          <Button
            variant="default"
            size="lg"
            onClick={handleCreateChallenge}
            className="w-full font-bold shadow-lg text-xs sm:text-sm h-11"
          >
            <Coins className="w-4 h-4 mr-2" />
            <span>Pay {selectedEntryFee}.00 NIM & Start Match</span>
          </Button>
        </div>

        {/* 🎮 2. Open Public Challenges */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FFCA1A]" />
              <span>Open Challenges</span>
            </span>
            <span className="text-[10px] text-muted-foreground">{openChallenges.length} Active</span>
          </div>

          <div className="space-y-1.5">
            {openChallenges.map((chall) => {
              const lvl = LEVELS.find((l) => l.id === chall.levelId) || LEVELS[0];
              return (
                <div
                  key={chall.id}
                  className="bg-muted/40 p-2.5 rounded-xl border border-border/50 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-xs sm:text-sm text-foreground">
                        {lvl.name}
                      </span>
                      <Badge variant="outline" className="text-[9px] text-[#FFCA1A] border-[#FFCA1A]/30">
                        {chall.entryFee} NIM
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>Pool: {chall.pool} NIM</span>
                      <span>•</span>
                      <span>
                        {chall.joinedCount}/{chall.maxPlayers} Joined
                      </span>
                      <span>•</span>
                      <span>By {chall.creator}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInvite(chall.id)}
                      className="h-8 px-2 text-[11px] border-border/60"
                      title="Share Challenge Link"
                    >
                      {copiedId === chall.id ? (
                        <Check className="w-3 h-3 text-[#00875a]" />
                      ) : (
                        <Share2 className="w-3 h-3 text-[#FFCA1A]" />
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleJoinChallenge(chall)}
                      className="h-8 px-3 text-xs font-bold"
                    >
                      <span>Join ({chall.entryFee}N)</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ⏱️ 3. My Matches */}
        {myMatches.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground px-1 block">My Active Matches</span>
            <div className="space-y-1.5">
              {myMatches.map((m) => (
                <div
                  key={m.id}
                  className="bg-muted/30 p-2.5 rounded-xl border border-border/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-foreground block">
                      Level {m.levelId} Challenge ({m.entryFee} NIM)
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Waiting for opponents • Pool: {m.pool} NIM
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyInvite(m.id)}
                    className="h-7 text-[10px] gap-1 border-border/60 text-[#FFCA1A]"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>{copiedId === m.id ? 'Copied!' : 'Share Link'}</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
