import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, HUDUpdateData } from './game/GameEngine';
import { GameState, LevelConfig, GameTelemetry } from './game/types';
import { LEVELS } from './game/data/levels';
import { StorageService, UserProgress } from './lib/persistence/StorageService';
import { NimiqWalletAccount, NimiqWalletService } from './lib/nimiq/NimiqWalletService';
import { MainMenu } from './components/Menus/MainMenu';
import { GameHUD } from './components/HUD/GameHUD';
import { PauseModal } from './components/Menus/PauseModal';
import { LevelCompleteModal } from './components/Menus/LevelCompleteModal';
import { GameOverModal } from './components/Menus/GameOverModal';
import { LevelSelectModal } from './components/Menus/LevelSelectModal';
import { DailyChallengeModal } from './components/Menus/DailyChallengeModal';
import { WalletModal } from './components/Wallet/WalletModal';
import { LeaderboardModal } from './components/Leaderboard/LeaderboardModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { HowToPlaySection } from './components/Sections/HowToPlaySection';
import { LevelPreviewSection } from './components/Sections/LevelPreviewSection';
import { LoadingScreen } from './components/Menus/LoadingScreen';
import { ReadyCountdown } from './components/HUD/ReadyCountdown';
import { AudioManager } from './game/audio/AudioManager';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const howToPlayRef = useRef<HTMLDivElement | null>(null);

  // App UI States
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [progress, setProgress] = useState<UserProgress>(StorageService.getProgress());
  const [wallet, setWallet] = useState<NimiqWalletAccount>(
    NimiqWalletService.getInstance().getAccount()
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPlayingActive =
    gameState === 'PLAYING' ||
    gameState === 'PAUSED' ||
    gameState === 'READY' ||
    gameState === 'LOADING';

  // Telemetry on level finish
  const [lastTelemetry, setLastTelemetry] = useState<GameTelemetry | null>(null);

  // HUD State
  const [hudData, setHudData] = useState<HUDUpdateData>({
    score: 0,
    combo: 1,
    remainingBalls: LEVELS[0].totalBalls,
    totalBalls: LEVELS[0].totalBalls,
    levelName: LEVELS[0].name,
    currentBallColor: 'ruby',
    nextBallColor: 'sapphire',
    progressPercent: 0,
  });

  // Modal Dialogs
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    // Initialize Nimiq wallet listener
    const unsubWallet = NimiqWalletService.getInstance().subscribe((acc) => {
      setWallet({ ...acc });
    });

    if (!canvasRef.current) return;

    // Initialize 3D Game Engine on persistent canvas
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Subscribe to state changes
    const unsubState = engine.stateMachine.subscribe((newState) => {
      setGameState(newState);

      // Transition background music volume smoothly between menu and active gameplay
      if (newState === 'TITLE' || newState === 'BOOT') {
        AudioManager.getInstance().setBgmMode('menu');
      } else if (
        newState === 'LOADING' ||
        newState === 'READY' ||
        newState === 'PLAYING'
      ) {
        AudioManager.getInstance().setBgmMode('game');
      }

      if (newState === 'LEVEL_COMPLETE' || newState === 'GAME_OVER') {
        const tel = engine.scoreSystem.getTelemetry(
          engine.currentLevel,
          newState === 'LEVEL_COMPLETE'
        );
        setLastTelemetry(tel);
        setProgress(StorageService.getProgress());
      }
    });

    // Subscribe to HUD updates
    engine.setHUDCallback((data) => {
      setHudData({ ...data });
    });

    // Load initial level with train of balls
    engine.loadLevel(LEVELS[0]);

    // Initial resize sync
    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        const w = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        const h = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
        engineRef.current.sceneManager.resize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      unsubWallet();
      unsubState();
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current && engineRef.current) {
        const w = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        const h = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
        engineRef.current.sceneManager.resize(w, h);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [isPlayingActive, isFullscreen]);

  const handlePlayQuick = () => {
    if (!engineRef.current) return;
    AudioManager.getInstance().setBgmMode('game');
    const targetLvl = LEVELS[Math.min(progress.unlockedLevel - 1, LEVELS.length - 1)];
    setCurrentLevel(targetLvl);
    engineRef.current.prepareGame(targetLvl);
  };

  const handleSelectLevel = (lvl: LevelConfig) => {
    if (!engineRef.current) return;
    AudioManager.getInstance().setBgmMode('game');
    setCurrentLevel(lvl);
    engineRef.current.prepareGame(lvl);
  };

  const handlePlayDaily = (lvl: LevelConfig) => {
    if (!engineRef.current) return;
    AudioManager.getInstance().setBgmMode('game');
    setCurrentLevel(lvl);
    engineRef.current.prepareGame(lvl);
  };

  const handlePause = () => {
    engineRef.current?.pause();
  };

  const handleResume = () => {
    engineRef.current?.resume();
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.prepareGame(currentLevel);
  };

  const handleNextLevel = () => {
    if (!engineRef.current) return;
    const nextIdx = currentLevel.id;
    if (nextIdx < LEVELS.length) {
      const nextLvl = LEVELS[nextIdx];
      setCurrentLevel(nextLvl);
      engineRef.current.prepareGame(nextLvl);
    } else {
      handleQuitToMenu();
    }
  };

  const handleQuitToMenu = () => {
    if (!engineRef.current) return;
    AudioManager.getInstance().setBgmMode('menu');
    setIsFullscreen(false);
    engineRef.current.stateMachine.setState('TITLE');
    engineRef.current.loadLevel(LEVELS[0]);
  };

  const handleSwap = () => {
    engineRef.current?.swapBall();
  };

  const handleToggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    setTimeout(() => {
      if (canvasRef.current && engineRef.current) {
        const w = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        const h = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
        engineRef.current.sceneManager.resize(w, h);
      }
    }, 60);
  };

  const scrollToHowToPlay = () => {
    howToPlayRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-foreground flex flex-col items-center w-full">
      {/* 1. Header & Hero Section (hidden when game is active) */}
      {!isPlayingActive && (
        <MainMenu
          onPlayQuick={handlePlayQuick}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenDaily={() => setShowDailyModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenWallet={() => setShowWalletModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onScrollToHowToPlay={scrollToHowToPlay}
          progress={progress}
          wallet={wallet}
        />
      )}

      {/* 2. PERSISTENT 3D DIORAMA CONTAINER (Canvas is NEVER unmounted!) */}
      {/* 2. Central 3D Canvas Viewport - Fully Centralized */}
      <div
        className={
          isFullscreen && isPlayingActive
            ? 'fixed inset-0 z-40 bg-[#020202] w-full h-full'
            : isPlayingActive
            ? 'w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-4 flex-1 flex flex-col items-center justify-center'
            : 'container mx-auto max-w-screen-xl px-3 sm:px-4 md:px-8 mt-8 sm:mt-12 md:mt-16 mb-16 sm:mb-24 md:mb-32 flex flex-col items-center'
        }
      >
        <div
          className={
            isFullscreen && isPlayingActive
              ? 'w-full h-full relative bg-cover bg-center'
              : isPlayingActive
              ? 'relative w-full max-w-5xl mx-auto h-[460px] sm:h-[560px] md:h-[680px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-border/40 bg-card shadow-2xl shadow-black/90 bg-cover bg-center'
              : 'relative w-full max-w-5xl mx-auto h-[350px] sm:h-[460px] md:h-[580px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-border/40 bg-card shadow-2xl shadow-black/80 bg-cover bg-center'
          }
          style={{
            backgroundImage: "url('/image copy2.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* THE SINGLE PERSISTENT CANVAS */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair bg-transparent"
          />

          {/* Loading Sequence Overlay */}
          {gameState === 'LOADING' && (
            <LoadingScreen
              levelName={currentLevel.name}
              onComplete={() => engineRef.current?.readyCountdown()}
            />
          )}

          {/* Ready 3-2-1 Countdown Overlay */}
          {gameState === 'READY' && (
            <ReadyCountdown
              onCountdownFinish={() => engineRef.current?.start()}
            />
          )}

          {/* In-Game HUD overlay */}
          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <GameHUD
              hudData={hudData}
              onPause={handlePause}
              onSwap={handleSwap}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          )}

          {/* Landing page call to action badge on canvas */}
          {(gameState === 'TITLE' || gameState === 'BOOT') && (
            <button
              onClick={handlePlayQuick}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 bg-background/85 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-border/60 shadow-lg text-[11px] sm:text-xs font-semibold text-foreground hover:bg-accent transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#FFCA1A] animate-pulse" />
              <span>Click to Start Trial</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Campaign Levels Preview & How to Play & Footer (shown on landing page) */}
      {(!isFullscreen || !isPlayingActive) && (
        <>
          {/* Level Previews in continuous translational motion */}
          <LevelPreviewSection
            onSelectLevel={handleSelectLevel}
            progress={progress}
          />

          <div ref={howToPlayRef} className="w-full flex flex-col items-center">
            <HowToPlaySection />
          </div>

          <footer className="w-full border-t border-border/40 py-6 md:px-8 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row max-w-screen-2xl px-4 sm:px-8 text-center md:text-left">
              <p className="text-balance text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left">
                Built by <span className="font-semibold text-foreground">Dynamio</span> for the Nimiq Mini App ecosystem.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>v1.0.0</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Modals & Dialogs */}
      <PauseModal
        open={gameState === 'PAUSED'}
        onResume={handleResume}
        onRestart={handleRestart}
        onOpenSettings={() => setShowSettingsModal(true)}
        onQuit={handleQuitToMenu}
      />

      <LevelCompleteModal
        open={gameState === 'LEVEL_COMPLETE'}
        telemetry={lastTelemetry}
        level={currentLevel}
        wallet={wallet}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onHome={handleQuitToMenu}
        onConnectWallet={() => setShowWalletModal(true)}
      />

      <GameOverModal
        open={gameState === 'GAME_OVER'}
        telemetry={lastTelemetry}
        level={currentLevel}
        onRetry={handleRestart}
        onHome={handleQuitToMenu}
      />

      <LevelSelectModal
        open={showLevelSelect}
        onOpenChange={setShowLevelSelect}
        onSelectLevel={handleSelectLevel}
        progress={progress}
      />

      <DailyChallengeModal
        open={showDailyModal}
        onOpenChange={setShowDailyModal}
        onPlayDaily={handlePlayDaily}
        progress={progress}
      />

      <WalletModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        wallet={wallet}
        progress={progress}
      />

      <LeaderboardModal
        open={showLeaderboardModal}
        onOpenChange={setShowLeaderboardModal}
      />

      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        progress={progress}
        onProgressUpdate={setProgress}
      />
    </div>
  );
};

export default App;
