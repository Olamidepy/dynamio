import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
  Trophy,
  Share2,
  Check,
  Lock,
  Globe,
  QrCode,
  ExternalLink,
  ArrowRight,
  Wallet,
  Copy,
  Loader2,
  Zap,
  ArrowLeft,
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

const ESCROW_TREASURY_ADDRESS = 'NQ81 BDH4 RKPV XMG3 T082 J84R QRPT VJEJ FUET';

const RECENT_WINNERS = [
  { player: '@NimiqKing', amount: 30.0, level: 'Amber Spiral', time: '12m ago' },
  { player: '@ChainMaster', amount: 17.0, level: 'Cobalt S-Bend', time: '28m ago' },
  { player: '@ZumaWizard', amount: 10.0, level: 'Neon Gateway', time: '1h ago' },
  { player: '@VortexHunter', amount: 45.0, level: 'Quantum Vortex', time: '2h ago' },
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
  const [selectedTab, setSelectedTab] = useState<string>('open');
  const [selectedEntryFee, setSelectedEntryFee] = useState<number>(20);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(2);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [openChallenges, setOpenChallenges] = useState<OpenChallenge[]>(INITIAL_OPEN_CHALLENGES);
  const [myMatches, setMyMatches] = useState<OpenChallenge[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTreasury, setCopiedTreasury] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    entryFee: number;
    level: LevelConfig;
    isCreate: boolean;
    challenge?: OpenChallenge;
  } | null>(null);
  const [isHubProcessing, setIsHubProcessing] = useState(false);

  // Pool distribution for 3 players
  const totalPool = selectedEntryFee * 3;
  const firstPrize = Math.round(totalPool * 0.5); // 50% = 30 NIM for 60
  const secondPrize = Math.round(totalPool * 0.283); // 28.3% = 17 NIM for 60
  const thirdPrize = Math.round(totalPool * 0.167); // 16.7% = 10 NIM for 60

  const handleCreateChallenge = async () => {
    const targetLvl = LEVELS.find((l) => l.id === selectedLevelId) || LEVELS[0];

    // If inside Nimiq Pay mini app with sufficient balance, execute directly
    if (wallet.isMiniApp && wallet.balanceNim >= selectedEntryFee) {
      try {
        await NimiqWalletService.getInstance().sendTransaction(ESCROW_TREASURY_ADDRESS, selectedEntryFee);
        finishCreateChallenge(targetLvl, selectedEntryFee);
        return;
      } catch (err) {
        console.warn('Mini-app payment not completed, showing checkout sheet', err);
      }
    }

    // Open Nimiq Pay / Hub Checkout Sheet
    setPendingPayment({
      entryFee: selectedEntryFee,
      level: targetLvl,
      isCreate: true,
    });
  };

  const handleJoinChallenge = async (challenge: OpenChallenge) => {
    const targetLvl = LEVELS.find((l) => l.id === challenge.levelId) || LEVELS[0];

    // If inside Nimiq Pay mini app with sufficient balance, execute directly
    if (wallet.isMiniApp && wallet.balanceNim >= challenge.entryFee) {
      try {
        await NimiqWalletService.getInstance().sendTransaction(ESCROW_TREASURY_ADDRESS, challenge.entryFee);
        finishJoinChallenge(challenge);
        return;
      } catch (err) {
        console.warn('Mini-app payment not completed, showing checkout sheet', err);
      }
    }

    // Open Nimiq Pay / Hub Checkout Sheet
    setPendingPayment({
      entryFee: challenge.entryFee,
      level: targetLvl,
      isCreate: false,
      challenge,
    });
  };

  const finishCreateChallenge = (targetLvl: LevelConfig, fee: number) => {
    const newChall: OpenChallenge = {
      id: `chall_${Date.now()}`,
      creator: wallet.address ? `${wallet.address.substring(0, 4)}...${wallet.address.slice(-4)}` : 'You',
      levelId: targetLvl.id,
      entryFee: fee,
      pool: fee * 3,
      joinedCount: 1,
      maxPlayers: 3,
      isPrivate,
    };

    if (!isPrivate) {
      setOpenChallenges([newChall, ...openChallenges]);
    }
    setMyMatches([newChall, ...myMatches]);

    setPendingPayment(null);
    onOpenChange(false);
    onStartChallengeMatch(targetLvl, fee);
  };

  const finishJoinChallenge = (challenge: OpenChallenge) => {
    const targetLvl = LEVELS.find((l) => l.id === challenge.levelId) || LEVELS[0];
    setPendingPayment(null);
    onOpenChange(false);
    onStartChallengeMatch(targetLvl, challenge.entryFee);
  };

  const handleHubCheckout = async (fee: number) => {
    const win = window as any;
    if (!win.HubApi) {
      alert('Nimiq Hub is loading. You can also tap "Open in Nimiq Pay" below.');
      return;
    }

    setIsHubProcessing(true);
    try {
      const hub = new win.HubApi('https://hub.nimiq.com');
      const cleanTreasury = ESCROW_TREASURY_ADDRESS.replace(/\s+/g, '').toUpperCase();
      const lunas = Math.round(fee * 1e5);

      await hub.checkout({
        appName: 'Dynamio Arena',
        recipient: cleanTreasury,
        value: lunas,
        shopLogoUrl: `${window.location.origin}/icon-192.png`,
      });

      if (pendingPayment) {
        if (pendingPayment.isCreate) {
          finishCreateChallenge(pendingPayment.level, pendingPayment.entryFee);
        } else if (pendingPayment.challenge) {
          finishJoinChallenge(pendingPayment.challenge);
        }
      }
    } catch (e: any) {
      console.warn('Hub checkout error:', e);
      alert(e.message || 'Payment was cancelled in Nimiq Hub.');
    } finally {
      setIsHubProcessing(false);
    }
  };

  const handleCopyTreasury = () => {
    navigator.clipboard.writeText(ESCROW_TREASURY_ADDRESS);
    setCopiedTreasury(true);
    setTimeout(() => setCopiedTreasury(false), 2000);
  };

  const handleCopyInvite = (challId: string) => {
    const inviteUrl = `${window.location.origin}/?challenge=${challId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(challId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 sm:p-8 space-y-6 overflow-x-hidden" onClose={() => onOpenChange(false)}>
        {/* Dialog Header with yellow thin line at bottom of header text */}
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            VS Challenges
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Compete on identical track seeds for real NIM prize pools.
          </DialogDescription>
          {/* Yellow thin line at the bottom of the header text */}
          <div className="h-[2px] w-full bg-[#FFCA1A] mt-2.5 rounded-full" />
        </DialogHeader>

        {pendingPayment ? (
          /* PAYMENT CHECKOUT SHEET */
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            {/* Header & Back */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <button
                onClick={() => setPendingPayment(null)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Arenas</span>
              </button>
              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/40">
                Track: {pendingPayment.level.name}
              </Badge>
            </div>

            {/* Entry Summary Card */}
            <div className="bg-gradient-to-br from-[#FFCA1A]/10 to-primary/5 p-4 rounded-xl border border-[#FFCA1A]/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium block">Entry Fee Required</span>
                <span className="font-heading font-black text-2xl text-foreground">
                  {pendingPayment.entryFee} NIM
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Prize Pool: {pendingPayment.entryFee * 3} NIM
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Mainnet Escrow
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  1st place takes {Math.round(pendingPayment.entryFee * 3 * 0.5)} NIM
                </span>
              </div>
            </div>

            {/* Payment Method 1: Deep Link to Nimiq Pay */}
            <div className="p-4 rounded-xl border border-[#FFCA1A]/40 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#FFCA1A]" />
                  <span>Instant Mobile Payment (Nimiq Pay)</span>
                </span>
                <Badge variant="secondary" className="text-[10px] text-[#FFCA1A] border-[#FFCA1A]/30">Recommended</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tapping below opens your Nimiq Pay mobile wallet directly with the {pendingPayment.entryFee} NIM transaction ready to approve.
              </p>
              <a
                href={`nimiq:${ESCROW_TREASURY_ADDRESS.replace(/\s+/g, '').toUpperCase()}?amount=${Math.round(pendingPayment.entryFee * 1e5)}`}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm gap-2 transition-transform active:scale-98 shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>Open in Nimiq Pay ({pendingPayment.entryFee} NIM)</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>

            {/* Payment Method 2: Nimiq Hub & QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nimiq Hub */}
              <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-foreground block mb-1">Nimiq Hub (Web)</span>
                  <p className="text-[11px] text-muted-foreground">
                    Sign using browser extension, ledger, or Nimiq Hub account.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleHubCheckout(pendingPayment.entryFee)}
                  disabled={isHubProcessing}
                  className="w-full text-xs font-semibold h-9"
                >
                  {isHubProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Opening Hub...</span>
                    </>
                  ) : (
                    <span>Pay with Nimiq Hub</span>
                  )}
                </Button>
              </div>

              {/* QR Code */}
              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block mb-1 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-[#FFCA1A]" />
                    <span>Scan with Phone</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Scan using Nimiq Pay camera to send {pendingPayment.entryFee} NIM.
                  </p>
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`nimiq:${ESCROW_TREASURY_ADDRESS.replace(/\s+/g, '').toUpperCase()}?amount=${Math.round(pendingPayment.entryFee * 1e5)}`)}`}
                  alt="Nimiq QR Code"
                  className="w-16 h-16 rounded-md border border-border shrink-0 bg-white p-1"
                />
              </div>
            </div>

            {/* Escrow Treasury Address & Copy */}
            <div className="bg-muted/30 p-3 rounded-lg border border-border/40 text-xs flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground block font-medium">Escrow Treasury Recipient</span>
                <span className="font-mono text-[11px] text-foreground truncate block">
                  {ESCROW_TREASURY_ADDRESS}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTreasury}
                className="h-7 px-2 text-[11px] shrink-0"
              >
                {copiedTreasury ? (
                  <Check className="w-3 h-3 text-emerald-400 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                <span>{copiedTreasury ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>

            {/* Launch Match Confirmation */}
            <div className="pt-2">
              <Button
                size="lg"
                onClick={() => {
                  if (pendingPayment.isCreate) {
                    finishCreateChallenge(pendingPayment.level, pendingPayment.entryFee);
                  } else if (pendingPayment.challenge) {
                    finishJoinChallenge(pendingPayment.challenge);
                  }
                }}
                className="w-full font-bold h-12 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>I've Sent Payment — Enter Arena Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Click above after sending payment in Nimiq Pay or Hub to enter the arena and battle for the pool!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Live Winners Feed */}
            <div className="flex items-center space-x-2 overflow-x-auto py-1 text-xs scrollbar-none border-b border-border/50">
              <span className="flex items-center gap-1 font-semibold text-muted-foreground shrink-0 text-xs pl-1">
                <Trophy className="w-3.5 h-3.5 text-[#FFCA1A]" />
                <span>Recent Winners:</span>
              </span>
              {RECENT_WINNERS.map((w, idx) => (
                <Badge key={idx} variant="secondary" className="shrink-0 font-normal text-xs py-1 px-2.5">
                  <span className="font-semibold text-foreground mr-1">{w.player}</span>
                  <span className="text-primary font-bold mr-1">+{w.amount} NIM</span>
                  <span className="text-muted-foreground text-[10px]">({w.level})</span>
                </Badge>
              ))}
            </div>

            {/* Tabs: Open Arenas, Create Arena */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} defaultValue="open" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="open">
                  Open Arenas ({openChallenges.length})
                </TabsTrigger>
                <TabsTrigger value="create">
                  Create Arena
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: OPEN ARENAS */}
              <TabsContent value="open" className="space-y-4">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base sm:text-lg">Active Public Arenas</CardTitle>
                    <CardDescription>
                      Join an open challenge to play immediately. Top scores take home the NIM pool.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {openChallenges.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No public challenges open right now. Switch to Create Arena to start one!
                      </div>
                    ) : (
                      openChallenges.map((chall) => {
                        const lvl = LEVELS.find((l) => l.id === chall.levelId) || LEVELS[0];
                        return (
                          <div
                            key={chall.id}
                            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors space-y-3"
                          >
                            {/* Top Row: Track & Entry fee badge & Contender count */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <span className="font-bold text-sm sm:text-base text-foreground truncate">
                                  {lvl.name}
                                </span>
                                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/40 shrink-0">
                                  {chall.entryFee} NIM
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground font-medium shrink-0">
                                {chall.joinedCount}/{chall.maxPlayers} Contenders
                              </span>
                            </div>

                            {/* Bottom Row: Pool details on left, Actions on right */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                              <div className="text-xs text-muted-foreground">
                                <span>Pool: <strong className="text-foreground font-semibold">{chall.pool} NIM</strong></span>
                                <span className="mx-2 opacity-30">•</span>
                                <span className="text-[11px]">Created by {chall.creator}</span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyInvite(chall.id)}
                                  className="h-8 px-2.5 text-xs font-medium"
                                  title="Copy Challenge Link"
                                >
                                  {copiedId === chall.id ? (
                                    <Check className="w-3.5 h-3.5 text-green-500 mr-1" />
                                  ) : (
                                    <Share2 className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  <span>{copiedId === chall.id ? 'Copied' : 'Share'}</span>
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleJoinChallenge(chall)}
                                  className="h-8 px-3.5 font-bold text-xs whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                >
                                  Join ({chall.entryFee} NIM)
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* My Active Matches Section if user has any */}
                {myMatches.length > 0 && (
                  <Card>
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-sm font-semibold">My Active Arenas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {myMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 text-xs gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              Level {m.levelId} Challenge ({m.entryFee} NIM)
                            </span>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Awaiting opponents • Pool: {m.pool} NIM
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInvite(m.id)}
                            className="h-8 text-xs shrink-0"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            <span>{copiedId === m.id ? 'Copied!' : 'Share Link'}</span>
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB 2: CREATE ARENA */}
              <TabsContent value="create" className="space-y-6">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base sm:text-lg">Arena Configuration</CardTitle>
                    <CardDescription>
                      Configure the track difficulty and wager amount. 3 players will compete on the exact same sequence.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* 1. Track Selection */}
                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-foreground">
                        Select Track
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {LEVELS.slice(0, 4).map((lvl) => {
                          const isSelected = selectedLevelId === lvl.id;
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => setSelectedLevelId(lvl.id)}
                              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                  : 'border-border bg-card hover:bg-muted/50'
                              }`}
                            >
                              <span className="text-xs font-semibold text-foreground truncate w-full">
                                {lvl.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground mt-0.5">
                                Level {lvl.id}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Wager Entry Fee */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">
                          Entry Fee per Player
                        </label>
                        <span className="text-xs text-muted-foreground">
                          Total Pool: <strong className="text-primary font-bold">{totalPool} NIM</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[5, 10, 20, 50].map((fee) => {
                          const isSelected = selectedEntryFee === fee;
                          return (
                            <Button
                              key={fee}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => setSelectedEntryFee(fee)}
                              className={`font-semibold h-11 ${
                                isSelected ? 'bg-primary text-primary-foreground' : ''
                              }`}
                            >
                              {fee} NIM
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Prize Pool Distribution Breakdown */}
                    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground">Prize Pool Distribution</span>
                        <span className="text-primary font-bold">{totalPool} NIM Total</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-md border border-border/60 bg-background/70 p-2.5">
                          <span className="text-[11px] text-muted-foreground block">1st Place</span>
                          <span className="text-sm sm:text-base font-bold text-primary">
                            {firstPrize} NIM
                          </span>
                          <span className="text-[10px] text-muted-foreground block">(50%)</span>
                        </div>
                        <div className="rounded-md border border-border/60 bg-background/70 p-2.5">
                          <span className="text-[11px] text-muted-foreground block">2nd Place</span>
                          <span className="text-sm sm:text-base font-bold text-foreground">
                            {secondPrize} NIM
                          </span>
                          <span className="text-[10px] text-muted-foreground block">(28.3%)</span>
                        </div>
                        <div className="rounded-md border border-border/60 bg-background/70 p-2.5">
                          <span className="text-[11px] text-muted-foreground block">3rd Place</span>
                          <span className="text-sm sm:text-base font-bold text-muted-foreground">
                            {thirdPrize} NIM
                          </span>
                          <span className="text-[10px] text-muted-foreground block">(16.7%)</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Privacy Toggle Switch */}
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          {isPrivate ? (
                            <Lock className="w-4 h-4 text-primary" />
                          ) : (
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {isPrivate ? 'Private Challenge' : 'Public Arena'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isPrivate
                            ? 'Only players with your direct challenge invite link can join'
                            : 'Listed publicly for any online player to join immediately'}
                        </p>
                      </div>
                      <Switch
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                        id="challenge-privacy"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button
                      size="lg"
                      onClick={handleCreateChallenge}
                      className="w-full font-bold h-12 text-sm"
                    >
                      <span>Create Arena ({selectedEntryFee} NIM)</span>
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
