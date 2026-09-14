import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  levelName?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  levelName = 'Level 1',
}) => {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Initializing 3D arcade engine...');

  useEffect(() => {
    // 5 seconds loading duration
    const TOTAL_DURATION_MS = 5000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / TOTAL_DURATION_MS) * 100);
      const rounded = Math.floor(pct);

      setProgress(rounded);

      if (rounded < 25) {
        setStageText('Initializing 3D diorama & shaders...');
      } else if (rounded < 50) {
        setStageText(`Loading spline trajectory: ${levelName}...`);
      } else if (rounded < 75) {
        setStageText('Calibrating physics chain & ball queue...');
      } else if (rounded < 98) {
        setStageText('Engaging Nimiq arcade systems...');
      } else {
        setStageText('ENGINE READY');
      }

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        setProgress(100);
        setStageText('ENGINE READY');
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete, levelName]);

  return (
    <div className="absolute inset-0 z-50 bg-[#020202]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center">
          <img
            src="/DynamioArtboard 1 copy 2.png"
            alt="Dynamio"
            className="h-16 sm:h-20 w-auto object-contain mb-3 drop-shadow-[0_4px_16px_rgba(255,202,26,0.35)] select-none animate-pulse"
          />
          <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-white uppercase">
            Dynamio
          </h2>
          {/* Straight thin yellow rectangle base */}
          <div className="h-1 w-28 bg-[#FFCA1A] rounded-full my-2.5 shadow-sm shadow-[#FFCA1A]/30" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Arcade Game Engine
          </span>
        </div>

        {/* 30-Second Loading Line & Status */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="truncate max-w-[220px] text-left">{stageText}</span>
            <span className="font-mono text-[#FFCA1A] font-bold">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-secondary/40 rounded-full overflow-hidden border border-border/50 shadow-inner">
            <div
              className="h-full bg-[#FFCA1A] transition-all duration-75 ease-linear shadow-sm shadow-[#FFCA1A]/50 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Subtle tip */}
        <div className="pt-2 text-[11px] text-muted-foreground/80">
          <span>Match 3+ contiguous colors to trigger cascading combos!</span>
        </div>
      </div>
    </div>
  );
};
