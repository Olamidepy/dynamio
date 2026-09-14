import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Flame, Play, Trophy } from 'lucide-react';
import { getDailyChallengeLevel } from '../../game/data/levels';
import { LevelConfig } from '../../game/types';
import { UserProgress } from '../../lib/persistence/StorageService';

interface DailyChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayDaily: (level: LevelConfig) => void;
  progress: UserProgress;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  open,
  onOpenChange,
  onPlayDaily,
  progress,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyLevel = getDailyChallengeLevel(todayStr);
  const alreadyPlayedToday = progress.lastDailyDate === todayStr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md text-center bg-card text-card-foreground border-border/50">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#FFCA1A]/10 border border-[#FFCA1A]/30 flex items-center justify-center mb-3">
          <Flame className="w-6 h-6 text-[#FFCA1A]" />
        </div>

        <h2 className="font-heading font-black text-2xl text-foreground">Today's Trial</h2>
        <div className="h-1 w-20 bg-[#FFCA1A] rounded-full mt-1.5 mb-2 mx-auto" />
        <p className="text-xs text-muted-foreground mt-1">
          {todayStr} • A synchronized daily track for the global Nimiq community.
        </p>

        {/* Challenge Stats Card */}
        <div className="bg-muted/40 p-4 rounded-xl my-4 text-left space-y-2.5 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Streak Bonus</span>
            <Badge variant="secondary" className="space-x-1 border-[#FFCA1A]/30 text-[#FFCA1A]">
              <Flame className="w-3 h-3 text-[#FFCA1A]" />
              <span>{progress.dailyStreak} Days</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Spheres</span>
            <span className="text-xs font-bold text-foreground">{dailyLevel.totalBalls} Balls</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Target Score</span>
            <span className="text-xs font-bold text-[#FFCA1A]">{dailyLevel.targetScore.toLocaleString()} PTS</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">NIM Pool Allocation</span>
            <Badge variant="secondary" className="border-[#FFCA1A]/30 text-[#FFCA1A]">{dailyLevel.baseRewardNim} NIM</Badge>
          </div>
        </div>

        {alreadyPlayedToday && (
          <div className="p-2.5 rounded-lg bg-[#FFCA1A]/10 border border-[#FFCA1A]/30 text-[#FFCA1A] text-xs mb-3 flex items-center justify-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#FFCA1A]" />
            <span>You have completed today's trial! Replays allowed for practice.</span>
          </div>
        )}

        <div className="flex flex-col space-y-2 mt-2">
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              onPlayDaily(dailyLevel);
              onOpenChange(false);
            }}
            className="w-full py-3.5 space-x-2"
          >
            <Play className="w-4 h-4 fill-[#FFCA1A] text-[#FFCA1A]" />
            <span>START TODAY'S TRIAL</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground hover:text-foreground text-xs"
          >
            Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
