import React from 'react';
import { Target, Layers, RotateCw, Trophy, MousePointer, Smartphone, Keyboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export const HowToPlaySection: React.FC = () => {
  return (
    <section id="how-to-play" className="container mx-auto max-w-screen-lg py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-3 sm:space-y-4 text-center mb-8 sm:mb-12">
        <div className="flex flex-col items-center">
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-foreground">
            How to Play
          </h2>
          {/* Straight thin yellow rectangle at the base of the header */}
          <div className="h-1 w-20 sm:w-28 bg-[#FFCA1A] rounded-full mt-2 sm:mt-2.5 shadow-sm shadow-[#FFCA1A]/20" />
        </div>
        <p className="max-w-[85%] leading-normal text-muted-foreground text-xs sm:text-sm md:text-base pt-1">
          Classic Zuma-inspired arcade mechanics. Simple to understand in seconds, thrilling to master.
        </p>
      </div>

      {/* 4 Steps Grid using official shadcn Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Step 1 */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="p-6 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFCA1A]/10 border border-[#FFCA1A]/25 text-[#FFCA1A] flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-[#FFCA1A]" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              1. Aim & Fire
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              Move your mouse or drag across the arena to rotate the central cannon. Click or tap to launch colored energy spheres toward the moving chain.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step 2 */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="p-6 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFCA1A]/10 border border-[#FFCA1A]/25 text-[#FFCA1A] flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-[#FFCA1A]" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              2. Match 3 or More
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              Slot your sphere adjacent to matching colors. Connecting with same-colored spheres scores points immediately; 3 or more contiguous balls explode into sparks!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step 3 */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="p-6 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFCA1A]/10 border border-[#FFCA1A]/25 text-[#FFCA1A] flex items-center justify-center mb-3">
              <RotateCw className="w-5 h-5 text-[#FFCA1A]" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              3. Magnetic Chain Reactions
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              Destroyed groups create gaps. The front cut segment rolls backward down the track to meet the rear segment at the back, triggering combo cascades!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step 4 */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="p-6 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFCA1A]/10 border border-[#FFCA1A]/25 text-[#FFCA1A] flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5 text-[#FFCA1A]" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              4. Protect the Core
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              Prevent the leading sphere from reaching the golden center vortex. Clear every sphere in the queue to achieve victory and unlock Nimiq rewards!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Controls Overview Card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur">
        <CardHeader className="text-center pb-3">
          <CardTitle className="font-heading text-lg font-bold text-foreground">
            Controls & Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-border/40 bg-background/50">
              <MousePointer className="w-5 h-5 text-[#FFCA1A]" />
              <span className="font-semibold text-sm text-foreground">Mouse / Pointer</span>
              <span className="text-xs text-muted-foreground">Move cursor to aim, Left-Click to shoot</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-border/40 bg-background/50">
              <Keyboard className="w-5 h-5 text-[#FFCA1A]" />
              <span className="font-semibold text-sm text-foreground">Spacebar / Right-Click</span>
              <span className="text-xs text-muted-foreground">Swap current ball with next queued ball</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-border/40 bg-background/50">
              <Smartphone className="w-5 h-5 text-[#FFCA1A]" />
              <span className="font-semibold text-sm text-foreground">Touch Screens</span>
              <span className="text-xs text-muted-foreground">Drag to aim, tap/release to fire</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
