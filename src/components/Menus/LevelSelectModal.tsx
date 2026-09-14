import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, Play, Lock } from 'lucide-react';
import { LEVELS } from '../../game/data/levels';
import { LevelConfig } from '../../game/types';
import { UserProgress } from '../../lib/persistence/StorageService';

interface LevelSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLevel: (level: LevelConfig) => void;
  progress: UserProgress;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  open,
  onOpenChange,
  onSelectLevel,
  progress,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl bg-card text-card-foreground border-border/50">
        <div className="mb-4">
          <h2 className="font-heading font-black text-2xl text-foreground">Arcade Campaign</h2>
          <div className="h-1 w-20 bg-[#FFCA1A] rounded-full mt-1.5 mb-2" />
          <p className="text-xs text-muted-foreground">
            7 handcrafted 3D tracks with progressive difficulty and rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= progress.unlockedLevel;
            const stars = progress.levelStars[level.id] || 0;
            const highScore = progress.highScores[level.id] || 0;

            return (
              <div
                key={level.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-card border-border/50 hover:border-[#FFCA1A]/40 hover:shadow-sm'
                    : 'bg-muted/20 border-border/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-foreground text-base">
                        {level.id}. {level.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 border-[#FFCA1A]/30 text-[#FFCA1A]"
                      >
                        {level.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Stars and High Score */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= stars
                            ? 'text-[#FFCA1A] fill-[#FFCA1A]'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                    {highScore > 0 && (
                      <span className="text-[11px] text-muted-foreground ml-2">
                        Best: {highScore.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {isUnlocked ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        onSelectLevel(level);
                        onOpenChange(false);
                      }}
                      className="px-3 py-1 text-xs space-x-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#FFCA1A] text-[#FFCA1A]" />
                      <span>Play</span>
                    </Button>
                  ) : (
                    <div className="flex items-center text-muted-foreground text-xs space-x-1">
                      <Lock className="w-3.5 h-3.5 text-[#FFCA1A]" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
