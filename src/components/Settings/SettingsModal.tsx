import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Volume2, VolumeX, Keyboard } from 'lucide-react';
import { AudioManager } from '../../game/audio/AudioManager';
import { StorageService, UserProgress } from '../../lib/persistence/StorageService';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: UserProgress;
  onProgressUpdate: (progress: UserProgress) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  progress,
  onProgressUpdate,
}) => {
  const audioManager = AudioManager.getInstance();
  const [muted, setMuted] = useState(progress.soundMuted);
  const [volume, setVolume] = useState(progress.soundVolume);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioManager.setMuted(next);
    const updated = { ...progress, soundMuted: next };
    StorageService.saveProgress(updated);
    onProgressUpdate(updated);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = parseFloat(e.target.value);
    setVolume(nextVol);
    audioManager.setVolume(nextVol);
    const updated = { ...progress, soundVolume: nextVol };
    StorageService.saveProgress(updated);
    onProgressUpdate(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md bg-card text-card-foreground border-border/50">
        <h2 className="font-heading font-black text-xl text-foreground">Settings</h2>
        <div className="h-1 w-14 bg-[#FFCA1A] rounded-full mt-1 mb-4" />

        {/* Audio Controls */}
        <div className="bg-muted/40 p-4 rounded-xl space-y-3 border border-border/40 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {muted ? (
                <VolumeX className="w-5 h-5 text-[#FFCA1A]" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#FFCA1A]" />
              )}
              <span className="text-sm font-semibold text-foreground">Audio & Effects</span>
            </div>
            <Button
              variant={muted ? 'destructive' : 'secondary'}
              size="sm"
              onClick={toggleMute}
              className="text-xs px-3"
            >
              {muted ? 'Unmute' : 'Mute'}
            </Button>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Master Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              disabled={muted}
              className="w-full accent-[#FFCA1A] cursor-pointer"
            />
          </div>

          <div className="flex space-x-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => audioManager.playShoot()}
              className="flex-1 text-[11px] py-1 text-muted-foreground hover:text-foreground"
            >
              Test Shoot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => audioManager.playMatch(3)}
              className="flex-1 text-[11px] py-1 text-muted-foreground hover:text-foreground"
            >
              Test Combo Chord
            </Button>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-2.5">
          <div className="flex items-center space-x-2 mb-1">
            <Keyboard className="w-4 h-4 text-[#FFCA1A]" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Control Guide
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Aim:</span>
              <span className="font-medium text-foreground">Mouse Cursor / Finger Drag</span>
            </div>
            <div className="flex justify-between">
              <span>Fire Ball:</span>
              <span className="font-medium text-foreground">Left Click / Screen Tap</span>
            </div>
            <div className="flex justify-between">
              <span>Swap Ball:</span>
              <span className="font-medium text-foreground">Spacebar / Right Click / UI Button</span>
            </div>
            <div className="flex justify-between">
              <span>Pause:</span>
              <span className="font-medium text-foreground">ESC / Pause Button</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
