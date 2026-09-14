import React, { useState } from 'react';
import { Wallet, Settings, Trophy, Layers, HelpCircle, Menu, X, Swords } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserProgress } from '../../lib/persistence/StorageService';
import { NimiqWalletAccount } from '../../lib/nimiq/NimiqWalletService';

interface MainMenuProps {
  onPlayQuick: () => void;
  onOpenLevelSelect: () => void;
  onOpenDaily: () => void;
  onOpenChallenge: () => void;
  onOpenLeaderboard: () => void;
  onOpenWallet: () => void;
  onOpenSettings: () => void;
  onScrollToHowToPlay: () => void;
  progress: UserProgress;
  wallet: NimiqWalletAccount;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlayQuick,
  onOpenLevelSelect,
  onOpenDaily,
  onOpenChallenge,
  onOpenLeaderboard,
  onOpenWallet,
  onOpenSettings,
  onScrollToHowToPlay,
  wallet,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Official shadcn/ui Header Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8 relative">
          {/* Brand Logo (Left) */}
          <div className="flex items-center cursor-pointer z-10">
            <img
              src="/DynamioArtboard 1 copy.png"
              alt="Dynamio"
              className="h-7 sm:h-8 md:h-9 w-auto object-contain select-none"
            />
          </div>

          {/* Desktop Navigation Links - Centered in Navbar */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 lg:gap-8 text-sm font-medium">
            <button
              onClick={onOpenDaily}
              className="transition-colors hover:text-foreground text-[#FFCA1A] font-semibold cursor-pointer"
            >
              Today
            </button>

            <button
              onClick={onOpenLevelSelect}
              className="transition-colors hover:text-foreground text-muted-foreground hover:text-[#FFCA1A] cursor-pointer"
            >
              Levels
            </button>

            <button
              onClick={onOpenChallenge}
              className="transition-colors hover:text-foreground text-muted-foreground hover:text-[#FFCA1A] cursor-pointer flex items-center gap-1.5"
            >
              <span>VS Challenges</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-[#FFCA1A] border-[#FFCA1A]/30">HOT</Badge>
            </button>

            <button
              onClick={onOpenLeaderboard}
              className="transition-colors hover:text-foreground text-muted-foreground hover:text-[#FFCA1A] cursor-pointer"
            >
              Leaderboard
            </button>

            <button
              onClick={onScrollToHowToPlay}
              className="transition-colors hover:text-foreground text-muted-foreground hover:text-[#FFCA1A] cursor-pointer"
            >
              How to play
            </button>

            <button
              onClick={onOpenSettings}
              className="transition-colors hover:text-foreground text-muted-foreground hover:text-[#FFCA1A] cursor-pointer"
            >
              Settings
            </button>
          </nav>

          {/* Right Actions: Wallet + Mobile Menu Button */}
          <div className="flex items-center gap-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWallet}
              className="gap-1.5 sm:gap-2 border-border/60 text-xs font-semibold px-2.5 sm:px-3"
            >
              <Wallet className="w-3.5 h-3.5 text-[#FFCA1A]" />
              <span className="hidden xs:inline">
                {wallet.isConnected ? `${wallet.balanceNim.toFixed(1)} NIM` : 'Connect Wallet'}
              </span>
              <span className="xs:hidden">
                {wallet.isConnected ? `${wallet.balanceNim.toFixed(0)}N` : 'Connect'}
              </span>
            </Button>

            {/* Mobile Nav Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-9 w-9 text-[#FFCA1A] hover:bg-accent"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#FFCA1A]" />
              ) : (
                <Menu className="w-5 h-5 text-[#FFCA1A]" />
              )}
            </Button>
          </div>
        </div>

        {/* Responsive Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/98 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-2xl text-left">
            <button
              onClick={() => {
                onOpenDaily();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-sm font-semibold text-[#FFCA1A] border-b border-border/30"
            >
              <span>Today's Trial</span>
              <span className="text-xs text-[#FFCA1A] font-mono">Daily</span>
            </button>

            <button
              onClick={() => {
                onOpenChallenge();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-sm text-foreground hover:text-[#FFCA1A] border-b border-border/30"
            >
              <div className="flex items-center space-x-1.5">
                <span>VS Challenges</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-[#FFCA1A] border-[#FFCA1A]/30">HOT</Badge>
              </div>
              <Swords className="w-3.5 h-3.5 text-[#FFCA1A]" />
            </button>

            <button
              onClick={() => {
                onOpenLevelSelect();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-sm text-foreground hover:text-[#FFCA1A] border-b border-border/30"
            >
              <span>7 Levels Campaign</span>
              <Layers className="w-3.5 h-3.5 text-[#FFCA1A]" />
            </button>

            <button
              onClick={() => {
                onOpenLeaderboard();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-sm text-foreground hover:text-[#FFCA1A] border-b border-border/30"
            >
              <span>Leaderboard</span>
              <Trophy className="w-3.5 h-3.5 text-[#FFCA1A]" />
            </button>

            <button
              onClick={() => {
                onScrollToHowToPlay();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-sm text-foreground hover:text-[#FFCA1A] border-b border-border/30"
            >
              <span>How to Play</span>
              <HelpCircle className="w-3.5 h-3.5 text-[#FFCA1A]" />
            </button>

            <button
              onClick={() => {
                onOpenSettings();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-sm text-foreground hover:text-[#FFCA1A]"
            >
              <span>Settings</span>
              <Settings className="w-3.5 h-3.5 text-[#FFCA1A]" />
            </button>
          </div>
        )}
      </header>

      {/* 2. Official shadcn/ui Hero Section - Generous Whitespace & Adjusted Down */}
      <section className="mx-auto flex max-w-[980px] w-full flex-col items-center pt-16 sm:pt-24 md:pt-32 lg:pt-36 pb-16 sm:pb-24 md:pb-28 text-center px-4">
        {/* Main Title with Straight Thin Yellow Rectangle Base */}
        <div className="flex flex-col items-center">
          <h1 className="font-heading font-bold text-2xl sm:text-4xl md:text-5xl uppercase text-foreground tracking-tight">
            Welcome to Dynamio
          </h1>
          {/* Straight thin yellow rectangle at the base of the header */}
          <div className="h-1 sm:h-1.5 w-44 sm:w-72 md:w-96 max-w-[85vw] bg-[#FFCA1A] rounded-full mt-3 sm:mt-4 shadow-sm shadow-[#FFCA1A]/20" />
        </div>

        {/* Subtitle with generous breathing room */}
        <p className="max-w-[700px] text-sm sm:text-base text-muted-foreground sm:text-lg px-2 mt-8 sm:mt-10 md:mt-12">
          A daily 3D chain reaction arcade game.
        </p>

        {/* Action Buttons with ample spacing */}
        <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-10 sm:pt-14 md:pt-16 max-w-xs sm:max-w-xl mx-auto">
          <Button
            variant="default"
            size="lg"
            onClick={onPlayQuick}
            className="w-full sm:w-36 font-bold shadow-lg h-11 sm:h-12 text-sm"
          >
            Play
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenChallenge}
            className="w-full sm:w-auto border-[#FFCA1A]/60 text-xs font-semibold gap-2 h-11 sm:h-12 px-4 text-[#FFCA1A] hover:bg-[#FFCA1A]/10 shadow-md shadow-[#FFCA1A]/10"
          >
            <Swords className="w-4 h-4 text-[#FFCA1A]" />
            <span>VS Challenges (20N Pool)</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenLevelSelect}
            className="w-full sm:w-auto border-border/60 text-xs font-semibold gap-2 h-11 sm:h-12 px-4"
          >
            <Layers className="w-4 h-4 text-[#FFCA1A]" />
            <span>7 Levels Campaign</span>
          </Button>
        </div>
      </section>
    </div>
  );
};

