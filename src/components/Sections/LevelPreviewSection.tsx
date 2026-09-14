import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Lock, Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LEVELS } from '../../game/data/levels';
import { LevelConfig } from '../../game/types';
import { UserProgress } from '../../lib/persistence/StorageService';

interface LevelPreviewSectionProps {
  onSelectLevel: (level: LevelConfig) => void;
  progress: UserProgress;
}

// Color palette mapping matching the 3D balls in the engine
const BALL_PALETTE: Record<string, { main: string; light: string; shadow: string }> = {
  ruby: { main: '#f43f5e', light: '#fda4af', shadow: '#9f1239' },
  sapphire: { main: '#3b82f6', light: '#93c5fd', shadow: '#1e40af' },
  amber: { main: '#f59e0b', light: '#fde68a', shadow: '#b45309' },
  emerald: { main: '#10b981', light: '#a7f3d0', shadow: '#047857' },
  amethyst: { main: '#a855f7', light: '#e9d5ff', shadow: '#6b21a8' },
};

/**
 * 1:1 Mini Canvas that renders each level's spline trajectory with real-time moving balls
 */
const LevelMiniCanvas: React.FC<{ level: LevelConfig; isLocked: boolean }> = ({ level, isLocked }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Build 3D Catmull-Rom curve from curvePoints
    const vectors = level.curvePoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);

    // Sample points along the spline
    const sampleCount = 140;
    const points: { x: number; z: number }[] = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i <= sampleCount; i++) {
      const pt = curve.getPoint(i / sampleCount);
      points.push({ x: pt.x, z: pt.z });
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
    }

    // Centering & scaling to fit into 1:1 square canvas with padding
    const padding = 38;
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const maxRange = Math.max(rangeX, rangeZ);
    const scale = (size - padding * 2) / maxRange;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const toScreen = (x: number, z: number) => ({
      x: size / 2 + (x - centerX) * scale,
      y: size / 2 + (z - centerZ) * scale,
    });

    const screenPoints = points.map((p) => toScreen(p.x, p.z));

    // Animation variables
    let animId: number;
    let startTime = performance.now();
    const trainBallCount = 18;
    const ballSpacing = 0.038;
    const ballRadius = 6.2;
    const speed = 0.05 + level.id * 0.008;

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, size, size);

      // 1. Dark circular diorama floor background
      const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
      bgGrad.addColorStop(0, '#0a0a0a');
      bgGrad.addColorStop(0.7, '#040404');
      bgGrad.addColorStop(1, '#020202');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Subtle radar / arena concentric rings
      ctx.strokeStyle = 'rgba(255, 202, 26, 0.04)';
      ctx.lineWidth = 1;
      [50, 90, 130].forEach((r) => {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 2. Track Base Glow & Double Rails
      if (screenPoints.length > 1) {
        // Track outer glow
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 202, 26, 0.12)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Track dark groove channel
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Track inner glowing rails
        ctx.strokeStyle = 'rgba(255, 202, 26, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 3. Central Vortex / Destination Hole
      const lastPoint = screenPoints[screenPoints.length - 1];
      if (lastPoint) {
        // Vortex glow
        const vortexGrad = ctx.createRadialGradient(
          lastPoint.x,
          lastPoint.y,
          2,
          lastPoint.x,
          lastPoint.y,
          16
        );
        vortexGrad.addColorStop(0, 'rgba(255, 202, 26, 0.8)');
        vortexGrad.addColorStop(0.4, 'rgba(255, 202, 26, 0.2)');
        vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Vortex center core
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFCA1A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 4. Moving Balls Train
      const headT = (elapsed * speed) % 1;

      for (let i = 0; i < trainBallCount; i++) {
        let t = headT - i * ballSpacing;
        while (t < 0) t += 1;
        t = t % 1;

        const pt3D = curve.getPointAt(t);
        const pos = toScreen(pt3D.x, pt3D.z);

        const colorName = level.colorPool[i % level.colorPool.length] || 'ruby';
        const color = BALL_PALETTE[colorName] || BALL_PALETTE.ruby;

        // Ball soft drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.arc(pos.x + 1.2, pos.y + 2, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3D Spherical Radial Gradient
        const ballGrad = ctx.createRadialGradient(
          pos.x - ballRadius * 0.35,
          pos.y - ballRadius * 0.35,
          ballRadius * 0.1,
          pos.x,
          pos.y,
          ballRadius
        );
        ballGrad.addColorStop(0, color.light);
        ballGrad.addColorStop(0.35, color.main);
        ballGrad.addColorStop(1, color.shadow);

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Top-left specular shiny highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(
          pos.x - ballRadius * 0.32,
          pos.y - ballRadius * 0.32,
          ballRadius * 0.26,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // 5. Central Golden Shooter station
      const cannonX = size / 2;
      const cannonY = size / 2;
      ctx.fillStyle = 'rgba(255, 202, 26, 0.2)';
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFCA1A';
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block object-cover transition-opacity duration-300 ${
        isLocked ? 'opacity-40 grayscale-[20%]' : 'opacity-100'
      }`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export const LevelPreviewSection: React.FC<LevelPreviewSectionProps> = ({
  onSelectLevel,
  progress,
}) => {
  const marqueeRef = useRef<HTMLDivElement | null>(null);

  // Duplicate levels to create an infinite, seamless continuous loop translational motion
  const duplicatedLevels = [...LEVELS, ...LEVELS];

  const handleScrollLeft = () => {
    if (marqueeRef.current) {
      marqueeRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (marqueeRef.current) {
      marqueeRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 flex flex-col items-center overflow-hidden">
      {/* 1. Section Header following strict shadcn/ui & yellow line base */}
      <div className="container mx-auto max-w-screen-lg flex flex-col items-center text-center px-4 mb-8 sm:mb-12">
        <div className="flex flex-col items-center">
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-foreground uppercase tracking-tight">
            Arcade Campaign Tracks
          </h2>
          {/* Straight thin yellow rectangle at the base of the header */}
          <div className="h-1 w-24 sm:w-36 bg-[#FFCA1A] rounded-full mt-2 sm:mt-2.5 shadow-sm shadow-[#FFCA1A]/25" />
        </div>

        <p className="max-w-[720px] leading-normal text-muted-foreground text-xs sm:text-sm md:text-base pt-3">
          7 handcrafted 3D tracks with moving energy queues. Complete each trial in sequence to unlock subsequent arenas.
        </p>

        {/* Action / Hint badge and manual scroll arrows */}
        <div className="flex items-center justify-between w-full max-w-screen-xl px-2 sm:px-4 mt-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#FFCA1A] animate-ping" />
            <span>Continuous translational preview • Hover to pause</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleScrollLeft}
              className="h-8 w-8 rounded-full border-border/60 hover:border-[#FFCA1A]/50 text-foreground"
              aria-label="Scroll levels left"
            >
              <ChevronLeft className="w-4 h-4 text-[#FFCA1A]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleScrollRight}
              className="h-8 w-8 rounded-full border-border/60 hover:border-[#FFCA1A]/50 text-foreground"
              aria-label="Scroll levels right"
            >
              <ChevronRight className="w-4 h-4 text-[#FFCA1A]" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Continuous Loop Translational Motion Track */}
      <div
        ref={marqueeRef}
        className="w-full overflow-x-auto no-scrollbar py-2 sm:py-4 px-4 flex"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="animate-translational-loop flex gap-4 sm:gap-6 items-center">
          {duplicatedLevels.map((level, idx) => {
            const isUnlocked = level.id <= progress.unlockedLevel;
            const stars = progress.levelStars[level.id] || 0;
            const highScore = progress.highScores[level.id] || 0;

            return (
              <Card
                key={`${level.id}-${idx}`}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectLevel(level);
                  }
                }}
                className={`w-64 sm:w-72 md:w-80 aspect-square flex-shrink-0 relative overflow-hidden rounded-2xl border transition-all duration-300 select-none group flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-border/60 bg-card/85 hover:border-[#FFCA1A]/60 hover:shadow-2xl hover:shadow-[#FFCA1A]/10 cursor-pointer'
                    : 'border-border/30 bg-card/40 opacity-75 cursor-not-allowed'
                }`}
              >
                {/* Background 1:1 animated mini canvas with moving balls */}
                <div className="absolute inset-0 z-0">
                  <LevelMiniCanvas level={level} isLocked={!isUnlocked} />
                </div>

                {/* Card Top: Level Badge & Lock / Unlocked Status */}
                <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur border border-border/60 text-foreground font-heading font-bold text-xs px-2.5 py-0.5 shadow-sm"
                    >
                      Stage {level.id}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 border-[#FFCA1A]/40 text-[#FFCA1A] bg-background/70 font-semibold"
                    >
                      {level.difficulty}
                    </Badge>
                  </div>

                  {isUnlocked ? (
                    <Badge className="bg-[#FFCA1A]/15 text-[#FFCA1A] border border-[#FFCA1A]/35 text-[10px] px-2 py-0.5 font-semibold">
                      <Play className="w-2.5 h-2.5 mr-1 fill-[#FFCA1A] text-[#FFCA1A]" /> Unlocked
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-background/85 backdrop-blur border-border/60 text-muted-foreground text-[10px] px-2 py-0.5 flex items-center"
                    >
                      <Lock className="w-2.5 h-2.5 mr-1 text-[#FFCA1A]" /> Locked
                    </Badge>
                  )}
                </div>

                {/* Card Center: Locked Frosted Overlay if level is locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 z-10 bg-[#020202]/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#020202]/90 border border-[#FFCA1A]/40 flex items-center justify-center shadow-lg shadow-black mb-2">
                      <Lock className="w-6 h-6 text-[#FFCA1A]" />
                    </div>
                    <span className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                      Level {level.id} Locked
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1 bg-background/80 px-2.5 py-0.5 rounded-full border border-border/40 font-medium">
                      Complete Level {level.id - 1} to Unlock
                    </span>
                  </div>
                )}

                {/* Card Bottom: Level Name, Stats, & CTA */}
                <div className="relative z-10 p-3 sm:p-4 bg-gradient-to-t from-[#020202] via-[#020202]/85 to-transparent pt-8 flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-base sm:text-lg text-white tracking-tight truncate">
                      {level.name}
                    </span>
                    <span className="text-xs font-mono text-[#FFCA1A] font-semibold flex-shrink-0">
                      +{level.baseRewardNim} NIM
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= stars
                              ? 'text-[#FFCA1A] fill-[#FFCA1A]'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                      {highScore > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                          {highScore.toLocaleString()} pts
                        </span>
                      )}
                    </div>

                    {isUnlocked && (
                      <span className="text-[11px] font-semibold text-[#FFCA1A] group-hover:underline flex items-center">
                        Play Stage <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
