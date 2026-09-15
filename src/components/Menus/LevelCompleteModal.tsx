import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, CheckCircle, RotateCcw, ArrowRight, Wallet, Trophy, Loader2, ExternalLink } from 'lucide-react';
import { GameTelemetry, LevelConfig } from '../../game/types';
import { RewardService, ClaimTicket } from '../../lib/rewards/RewardService';
import { NimiqWalletAccount, NimiqWalletService } from '../../lib/nimiq/NimiqWalletService';
import { StorageService } from '../../lib/persistence/StorageService';

interface LevelCompleteModalProps {
  open: boolean;
  telemetry: GameTelemetry | null;
  level: LevelConfig;
  wallet: NimiqWalletAccount;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
  onConnectWallet: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  open,
  telemetry,
  level,
  wallet,
  onNextLevel,
  onReplay,
  onHome,
  onConnectWallet,
}) => {
  const [claimTicket, setClaimTicket] = useState<ClaimTicket | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !telemetry) return;

    // Fire winning confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFCA1A', '#00875a', '#00b0ff'],
    });

    // Generate claim ticket
    const ticket = RewardService.generateClaimTicket(telemetry, level);
    setClaimTicket(ticket);
    setIsClaiming(false);
    setIsClaimed(false);
    setClaimTxHash(null);

    // Save progression
    StorageService.recordLevelCompletion(
      level.id,
      telemetry.score,
      3,
      ticket.nimReward,
      ticket.energyReward
    );
  }, [open, telemetry, level]);

  if (!open || !telemetry || !claimTicket) return null;

  const handleClaim = async () => {
    if (!wallet.isConnected) {
      onConnectWallet();
      return;
    }
    if (!claimTicket) return;

    setIsClaiming(true);
    try {
      const res = await NimiqWalletService.getInstance().claimRewardTransaction(
        claimTicket.nimReward,
        claimTicket.ticketId
      );
      if (res.success) {
        setIsClaimed(true);
        setClaimTxHash(res.txHash || 'nim_tx_' + Date.now());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm sm:max-w-md text-center p-6 bg-card border border-border/60 text-card-foreground shadow-2xl rounded-2xl">
        {/* Victory Trophy */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FFCA1A]/10 border border-[#FFCA1A]/30 flex items-center justify-center mb-3">
          <Trophy className="w-8 h-8 text-[#FFCA1A]" />
        </div>

        <h2 className="font-heading font-black text-2xl text-foreground mb-1">
          LEVEL COMPLETE!
        </h2>
        <div className="h-1 w-24 bg-[#FFCA1A] rounded-full mt-1 mb-2.5 mx-auto" />
        <p className="text-xs text-muted-foreground mb-4 font-medium">
          {level.name} — Sector Cleared
        </p>

        {/* Stars */}
        <div className="flex justify-center space-x-2 mb-5">
          {[1, 2, 3].map((star) => (
            <Star
              key={star}
              className="w-7 h-7 text-[#FFCA1A] fill-[#FFCA1A]"
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-xl border border-border/40 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Dyno Points</span>
            <span className="font-heading font-bold text-lg text-foreground">
              {telemetry.score.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col border-x border-border/40">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Max Combo</span>
            <span className="font-heading font-bold text-lg text-[#FFCA1A]">
              {telemetry.highestCombo}x
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Accuracy</span>
            <span className="font-heading font-bold text-lg text-[#FFCA1A]">
              {telemetry.accuracy}%
            </span>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-muted/30 p-4 rounded-xl text-left border border-border/40 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-[#FFCA1A]" />
              <span>Rewards Unlocked</span>
            </span>
            <Badge variant="secondary" className="border-[#FFCA1A]/30 text-[#FFCA1A]">+{claimTicket.energyReward} Energy</Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div>
              <span className="text-sm font-bold text-foreground block">
                {claimTicket.nimReward} NIM
              </span>
              <span className="text-[10px] text-muted-foreground">
                Validated performance reward
              </span>
            </div>

            {isClaimed ? (
              <Badge variant="secondary" className="space-x-1 border-[#FFCA1A]/30 text-[#FFCA1A]">
                <CheckCircle className="w-3.5 h-3.5 text-[#FFCA1A]" />
                <span>Claimed!</span>
              </Badge>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleClaim}
                disabled={isClaiming}
                className="px-3 py-1.5 space-x-1.5"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFCA1A]" />
                    <span>Signing...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-3.5 h-3.5 text-[#FFCA1A]" />
                    <span>{wallet.isConnected ? 'Claim NIM' : 'Connect Wallet'}</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {claimTxHash && (
            <div className="mt-2.5 p-2 bg-background/60 rounded-lg border border-border/40 text-left">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Received on Nimiq Network
                </span>
                <a
                  href={`https://nimiq.watch/#${claimTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFCA1A] hover:underline flex items-center gap-0.5 font-medium"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-[9px] text-muted-foreground font-mono truncate">
                Tx: {claimTxHash}
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onReplay}
            className="flex-1 py-2.5 space-x-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Replay</span>
          </Button>

          {level.id < 7 ? (
            <Button
              variant="default"
              onClick={onNextLevel}
              className="flex-1 py-2.5 space-x-1.5 text-xs"
            >
              <span>Next Level</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FFCA1A]" />
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={onHome}
              className="flex-1 py-2.5 space-x-1.5 text-xs"
            >
              <span>Main Menu</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
