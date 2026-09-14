import React from 'react';
import { Pause, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { HUDUpdateData } from '../../game/GameEngine';
import { SPHERE_COLORS } from '../../game/types';

interface GameHUDProps {
  hudData: HUDUpdateData;
  onPause: () => void;
  onSwap: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hudData,
  onPause,
  onSwap,
}) => {
  const currentColor = SPHERE_COLORS[hudData.currentBallColor];
  const nextColor = SPHERE_COLORS[hudData.nextBallColor];

  // Dynamic NIM conversion: Max 1 NIM for level 1 up to 7 NIM for level 7
  const maxLevelNim = Math.min(Math.max(hudData.levelId || 1, 1), 7);
  const targetScore = hudData.targetScore || 2500;
  const estimatedNim = Math.min(maxLevelNim, (hudData.score / targetScore) * maxLevelNim);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6 select-none z-20">
      {/* Top Header & Docked Combo Container */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center pointer-events-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between w-full pointer-events-auto gap-2">
          {/* Left: Level & Progress */}
          <div className="bg-background/90 backdrop-blur-md px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center space-x-2 sm:space-x-3 shadow-sm border border-border/50">
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-heading font-bold text-xs sm:text-sm text-foreground truncate max-w-[85px] sm:max-w-none">
                  {hudData.levelName}
                </span>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 border-border/60 text-[#FFCA1A]">
                  {hudData.remainingBalls} LEFT
                </Badge>
              </div>
              <div className="w-18 sm:w-28 md:w-36 mt-1 sm:mt-1.5">
                <Progress value={hudData.progressPercent} />
              </div>
            </div>
          </div>

          {/* Center: Dyno Points with Real-Time NIM Conversion */}
          <div className="bg-background/90 backdrop-blur-md px-3 py-1 sm:px-5 sm:py-1.5 rounded-lg sm:rounded-xl flex flex-col items-center shadow-sm border border-border/50">
            <span className="text-[8px] sm:text-[9px] tracking-wider uppercase text-muted-foreground font-bold">
              Dyno Points
            </span>
            <span className="font-heading font-extrabold text-base sm:text-2xl md:text-3xl text-foreground tracking-tight leading-none">
              {hudData.score.toLocaleString()}
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#FFCA1A] mt-0.5 leading-none">
              ≈ {estimatedNim.toFixed(2)} NIM
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 pointer-events-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={onPause}
              className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-10 sm:w-10 bg-background/90 backdrop-blur-md border-border/50 text-[#FFCA1A] hover:bg-accent"
              title="Pause Game (ESC)"
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFCA1A]" />
            </Button>
          </div>
        </div>

        {/* Floating Combo Multiplier - Docked right ABOVE the field (Never blocks balls or shooter!) */}
        {hudData.combo > 1 && (
          <div className="mt-2 animate-bounce-subtle pointer-events-none">
            <div className="bg-background/95 backdrop-blur-md px-3 sm:px-4 py-1 rounded-full border border-[#FFCA1A]/60 shadow-lg shadow-black/80">
              <span className="font-heading font-black text-xs sm:text-sm text-[#FFCA1A] tracking-wider">
                {hudData.combo}X {hudData.combo >= 3 ? 'CHAIN REACTION!' : 'COMBO!'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shooter Ammo Dock */}
      <div className="self-center pointer-events-auto flex items-center space-x-3 sm:space-x-4 bg-background/90 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-md border border-border/50 mb-1 sm:mb-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Current Ball */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">
              Active
            </span>
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-sm border border-border/60 transition-transform active:scale-95"
              style={{
                backgroundColor: currentColor?.css || '#ff2a5f',
              }}
            />
          </div>

          {/* Swap Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSwap}
            className="rounded-lg px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs text-foreground border-border/60 hover:bg-accent flex items-center space-x-1 shadow-none"
            title="Swap with Next Ball (Space / Right-Click)"
          >
            <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FFCA1A]" />
            <span className="font-bold">SWAP</span>
          </Button>

          {/* Next Queued Ball */}
          <div className="flex flex-col items-center opacity-85">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">
              Next
            </span>
            <div
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-sm border border-border/60"
              style={{
                backgroundColor: nextColor?.css || '#1e88e5',
              }}
            />
          </div>
        </div>

        <div className="hidden sm:block border-l border-border/50 pl-3">
          <p className="text-[10px] text-muted-foreground leading-tight">
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 text-foreground font-mono text-[10px]">
              Aim
            </kbd>{' '}
            Mouse/Touch
            <br />
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 text-foreground font-mono text-[10px]">
              Shoot
            </kbd>{' '}
            Click/Tap
          </p>
        </div>
      </div>
    </div>
  );
};
