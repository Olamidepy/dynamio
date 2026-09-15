import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RotateCcw, Home, AlertOctagon, Wallet, CheckCircle, Loader2, Coins, ExternalLink } from 'lucide-react';
import { GameTelemetry, LevelConfig } from '../../game/types';
import { RewardService } from '../../lib/rewards/RewardService';
import { NimiqWalletAccount, NimiqWalletService } from '../../lib/nimiq/NimiqWalletService';

interface GameOverModalProps {
  open: boolean;
  telemetry: GameTelemetry | null;
  level: LevelConfig;
  wallet?: NimiqWalletAccount;
  onRetry: () => void;
  onHome: () => void;
  onConnectWallet?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  open,
  telemetry,
  level,
  wallet,
  onRetry,
  onHome,
  onConnectWallet,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  const reward = telemetry ? RewardService.calculateRewards(telemetry, level) : { nimReward: 0, energyReward: 0 };

  const handleClaim = async () => {
    if (!wallet || !wallet.isConnected) {
      if (onConnectWallet) onConnectWallet();
      return;
    }
    if (reward.nimReward <= 0 || isClaimed) return;

    setIsClaiming(true);
    try {
      const res = await NimiqWalletService.getInstance().claimRewardTransaction(
        reward.nimReward,
        `consolation_${level.id}_${Date.now()}`
      );
      if (res.success) {
        setIsClaimed(true);
        setClaimTxHash(res.txHash || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-xs sm:max-w-sm text-center bg-card text-card-foreground border-border/50 p-6 rounded-2xl shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6 text-[#FFCA1A]" />
        </div>

        <h2 className="font-heading font-black text-2xl text-foreground">Chain Breached!</h2>
        <div className="h-1 w-20 bg-[#FFCA1A] rounded-full mt-1.5 mb-2 mx-auto" />
        <p className="text-xs text-muted-foreground mt-1">
          The spheres reached the vortex gate.
        </p>

        {telemetry && (
          <div className="bg-muted/40 p-3.5 rounded-xl my-4 space-y-2 text-left border border-border/40">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Dyno Points</span>
              <span className="font-heading font-bold text-sm text-foreground">{telemetry.score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Highest Combo</span>
              <span className="font-bold text-[#FFCA1A]">{telemetry.highestCombo}x</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Accuracy</span>
              <span className="font-bold text-[#FFCA1A]">{telemetry.accuracy}%</span>
            </div>

            {/* Dyno Points -> Nimiq Consolation Conversion */}
            <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-foreground block flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#FFCA1A]" />
                  <span>Converted NIM</span>
                </span>
                <span className="text-[9px] text-muted-foreground">Points consolation reward</span>
              </div>
              <span className="font-heading font-extrabold text-sm text-[#FFCA1A]">
                +{reward.nimReward.toFixed(2)} NIM
              </span>
            </div>
          </div>
        )}

        {/* Claim Consolation Reward Button */}
        {reward.nimReward > 0 && (
          <div className="mb-4">
            {isClaimed ? (
              <div className="space-y-1.5">
                <Badge variant="secondary" className="w-full py-1.5 justify-center space-x-1 border-[#FFCA1A]/30 text-[#FFCA1A]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#FFCA1A]" />
                  <span>NIM Sent to Nimiq Pay!</span>
                </Badge>
                {claimTxHash && (
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40 text-left">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Blockchain Receipt</span>
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
                    <p className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">
                      Tx: {claimTxHash}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full border-[#FFCA1A]/50 text-[#FFCA1A] hover:bg-[#FFCA1A]/10 text-xs py-2 flex items-center justify-center space-x-1.5"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFCA1A]" />
                    <span>Signing Claim...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-3.5 h-3.5 text-[#FFCA1A]" />
                    <span>Claim +{reward.nimReward.toFixed(2)} NIM Reward</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <Button
            variant="default"
            onClick={onRetry}
            className="w-full py-2.5 rounded-lg flex items-center justify-center space-x-2 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Try Again</span>
          </Button>

          <Button
            variant="ghost"
            onClick={onHome}
            className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center space-x-1"
          >
            <Home className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Main Menu</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
