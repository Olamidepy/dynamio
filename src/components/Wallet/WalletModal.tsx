import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Wallet, Copy, Check, LogOut, ShieldCheck } from 'lucide-react';
import { NimiqWalletAccount, NimiqWalletService } from '../../lib/nimiq/NimiqWalletService';
import { UserProgress } from '../../lib/persistence/StorageService';
import { NimiqIdenticon } from '../ui/NimiqIdenticon';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: NimiqWalletAccount;
  progress: UserProgress;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  open,
  onOpenChange,
  wallet,
  progress,
}) => {
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.formattedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await NimiqWalletService.getInstance().connect();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    NimiqWalletService.getInstance().disconnect();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md bg-card text-card-foreground border-border/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFCA1A]/10 border border-[#FFCA1A]/30 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#FFCA1A]" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl text-foreground">Nimiq Wallet</h2>
            <div className="h-1 w-16 bg-[#FFCA1A] rounded-full mt-1 mb-1.5" />
            <p className="text-xs text-muted-foreground">Mini App & Web Client Integration</p>
          </div>
        </div>

        {wallet.isConnected ? (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border/40 text-center">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                NIM Balance
              </span>
              <span className="font-heading font-black text-3xl text-foreground block mt-1">
                {wallet.balanceNim.toFixed(2)}{' '}
                <span className="text-[#FFCA1A] text-xl font-bold">NIM</span>
              </span>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-[10px] border-[#FFCA1A]/30 text-[#FFCA1A]">
                  Total Claimed: {progress.totalNimClaimed.toFixed(2)} NIM
                </Badge>
              </div>
            </div>

            {/* Address Details with Nimiq Identicon */}
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-medium">Your Nimiq Address</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-[11px] text-[#FFCA1A] hover:underline cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#FFCA1A]" />
                      <span className="text-[#FFCA1A] font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#FFCA1A]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-3 bg-background/80 p-2.5 rounded-lg border border-border/50">
                <NimiqIdenticon address={wallet.address} size={36} className="shrink-0" />
                <p className="font-mono text-xs text-foreground break-all">
                  {wallet.formattedAddress}
                </p>
              </div>
              {wallet.isMiniApp && (
                <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-green-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Connected via Nimiq Pay Mini App</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-start space-x-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-[#FFCA1A] shrink-0 mt-0.5" />
              <span>
                Zero custody. Dynamio never has access to your private keys or seed phrases.
                Transactions require explicit approval.
              </span>
            </div>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full rounded-xl py-2 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FFCA1A]" />
              <span>Disconnect Wallet</span>
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Connect your Nimiq wallet to claim arcade rewards, compete on daily leaderboards, and verify performance on-chain.
            </p>

            <Button
              variant="default"
              size="lg"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-3 space-x-2"
            >
              <Wallet className="w-4 h-4 text-[#FFCA1A]" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Nimiq Wallet'}</span>
            </Button>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground text-left space-y-1">
              <p className="font-semibold text-foreground">Free to Play:</p>
              <p>
                You can play all 7 levels and the daily challenge without connecting a wallet first.
                Connect anytime to withdraw earned NIM rewards.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
