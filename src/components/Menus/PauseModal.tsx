import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';

interface PauseModalProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  open,
  onResume,
  onRestart,
  onOpenSettings,
  onQuit,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-xs text-center bg-card text-card-foreground border-border/50">
        <h2 className="font-heading font-black text-2xl text-foreground mb-1">Paused</h2>
        <div className="h-1 w-14 bg-[#FFCA1A] rounded-full mt-1 mb-2.5 mx-auto" />
        <p className="text-xs text-muted-foreground mb-6">Game simulation suspended.</p>

        <div className="flex flex-col space-y-2.5">
          <Button
            variant="default"
            onClick={onResume}
            className="w-full py-2.5 rounded-lg flex items-center justify-center space-x-2 text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-[#FFCA1A] text-[#FFCA1A]" />
            <span>Resume</span>
          </Button>

          <Button
            variant="outline"
            onClick={onRestart}
            className="w-full py-2.5 rounded-lg flex items-center justify-center space-x-2 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Restart</span>
          </Button>

          <Button
            variant="outline"
            onClick={onOpenSettings}
            className="w-full py-2 rounded-lg flex items-center justify-center space-x-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Settings</span>
          </Button>

          <Button
            variant="ghost"
            onClick={onQuit}
            className="w-full py-2 text-xs text-muted-foreground hover:text-red-500 flex items-center justify-center space-x-1.5"
          >
            <Home className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>Quit to Menu</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
