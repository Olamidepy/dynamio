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
  const [manualAddress, setManualAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

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

  const handleHubConnect = async () => {
    setIsConnecting(true);
    setAddressError('');
    try {
      await NimiqWalletService.getInstance().connectViaHub();
      setIsEditingAddress(false);
    } catch (e: any) {
      setAddressError(e.message || 'Could not connect via Nimiq Hub');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSetManual = async (addrToSet?: string) => {
    const target = addrToSet || manualAddress;
    if (!target.trim()) return;
    setIsConnecting(true);
    setAddressError('');
    try {
      await NimiqWalletService.getInstance().setAddress(target);
      setIsEditingAddress(false);
      setManualAddress('');
    } catch (e: any) {
      setAddressError(e.message || 'Invalid Nimiq address');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    NimiqWalletService.getInstance().disconnect();
    setIsEditingAddress(false);
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
            <p className="text-xs text-muted-foreground">Live Nimiq Mainnet Wallet</p>
          </div>
        </div>

        {wallet.isConnected ? (
          <div className="space-y-4">
            {/* Scraped Nimiq Account Profile Card (Nimiq Pay Style) */}
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3 min-w-0">
                <NimiqIdenticon address={wallet.address} size={48} showBorder />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-bold text-base text-foreground truncate">
                      {wallet.label || 'Nimiq Account'}
                    </span>
                    {wallet.colorName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#FFCA1A]/20 text-[#FFCA1A] border border-[#FFCA1A]/30">
                        {wallet.colorName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary font-medium truncate mt-0.5">
                    {wallet.moniker || 'Arcade Contender'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-heading font-extrabold text-base text-foreground block">
                  {wallet.balanceNim.toFixed(1)} NIM
                </span>
                <span className="text-[10px] text-green-500 font-semibold flex items-center justify-end gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Mainnet
                </span>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-medium">Active Nimiq Address</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-[11px] text-[#FFCA1A] hover:underline cursor-pointer font-medium"
                  >
                    {isEditingAddress ? 'Cancel' : 'Switch Address'}
                  </button>
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
              </div>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                <p className="font-mono text-xs text-foreground break-all">
                  {wallet.formattedAddress}
                </p>
              </div>

              {/* Switch address inline panel */}
              {isEditingAddress && (
                <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                  <label className="text-[11px] text-muted-foreground font-medium block">
                    Paste your Nimiq Address:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="NQ39 NN4C GDNQ TFT4..."
                      className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-[#FFCA1A]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSetManual()}
                      disabled={isConnecting || !manualAddress.trim()}
                      className="text-xs"
                    >
                      Set
                    </Button>
                  </div>
                  {addressError && <p className="text-[11px] text-red-500">{addressError}</p>}

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => handleSetManual('NQ39 NN4C GDNQ TFT4 EYCX C6TF KM4B 17SG N229')}
                      className="text-[10px] px-2 py-1 rounded bg-[#FFCA1A]/10 text-[#FFCA1A] border border-[#FFCA1A]/30 hover:bg-[#FFCA1A]/20 transition-colors"
                    >
                      Use Red Address (NQ39...)
                    </button>
                    <button
                      onClick={() => handleSetManual('NQ51 2GCM 2F0A P92H VN8H 9TL1 DUSP 1FSG CDDV')}
                      className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
                    >
                      Use Personal (NQ51...)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-start space-x-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-[#FFCA1A] shrink-0 mt-0.5" />
              <span>
                Rewards cleared in solo levels will be disbursed directly from Game Treasury to this address.
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
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Connect your Nimiq address to receive automated solo payouts and participate in live on-chain arena matches.
            </p>

            {/* Paste Address directly */}
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40 space-y-2.5 text-left">
              <label className="text-[11px] text-muted-foreground font-medium block">
                Enter your Nimiq Address:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="NQ39 NN4C GDNQ TFT4..."
                  className="flex-1 bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-[#FFCA1A]"
                />
                <Button
                  size="sm"
                  onClick={() => handleSetManual()}
                  disabled={isConnecting || !manualAddress.trim()}
                  className="text-xs px-3"
                >
                  Connect
                </Button>
              </div>
              {addressError && <p className="text-[11px] text-red-500">{addressError}</p>}

              {/* Quick Select Buttons */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-muted-foreground block">Quick Connect:</span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleSetManual('NQ39 NN4C GDNQ TFT4 EYCX C6TF KM4B 17SG N229')}
                    className="text-left text-xs p-2 rounded-lg bg-background/80 hover:bg-muted/40 border border-[#FFCA1A]/30 flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-foreground">Red Address (NQ39...)</span>
                    <span className="text-[10px] text-[#FFCA1A] font-bold">1,765 NIM</span>
                  </button>
                  <button
                    onClick={() => handleSetManual('NQ51 2GCM 2F0A P92H VN8H 9TL1 DUSP 1FSG CDDV')}
                    className="text-left text-xs p-2 rounded-lg bg-background/80 hover:bg-muted/40 border border-border flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-foreground">Personal Wallet (NQ51...)</span>
                    <span className="text-[10px] text-muted-foreground">Mainnet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Connect via Nimiq Hub */}
            <Button
              variant="outline"
              onClick={handleHubConnect}
              disabled={isConnecting}
              className="w-full py-2.5 text-xs font-semibold border-border/60 space-x-2"
            >
              <Wallet className="w-4 h-4 text-[#FFCA1A]" />
              <span>Connect with Nimiq Hub</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
