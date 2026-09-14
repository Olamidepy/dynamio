import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { RotateCcw, Home, AlertOctagon } from 'lucide-react';
import { GameTelemetry, LevelConfig } from '../../game/types';

interface GameOverModalProps {
  open: boolean;
  telemetry: GameTelemetry | null;
  level: LevelConfig;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  open,
  telemetry,
  level,
  onRetry,
  onHome,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-xs text-center bg-card text-card-foreground border-border/50">
        <div className="mx-auto w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6 text-[#FFCA1A]" />
        </div>

        <h2 className="font-heading font-black text-2xl text-foreground">Chain Breached!</h2>
        <div className="h-1 w-20 bg-[#FFCA1A] rounded-full mt-1.5 mb-2 mx-auto" />
        <p className="text-xs text-muted-foreground mt-1">
          The spheres reached the vortex gate.
        </p>

        {telemetry && (
          <div className="bg-muted/40 p-3 rounded-xl my-4 space-y-1.5 text-left border border-border/40">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Final Score</span>
              <span className="font-bold text-foreground">{telemetry.score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Highest Combo</span>
              <span className="font-bold text-[#FFCA1A]">{telemetry.highestCombo}x</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="font-bold text-[#FFCA1A]">{telemetry.accuracy}%</span>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <Button
            variant="default"
            onClick={onRetry}
            className="w-full py-2.5 rounded-lg flex items-center justify-center space-x-2 text-xs"
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
