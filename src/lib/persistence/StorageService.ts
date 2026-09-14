export interface UserProgress {
  highScores: Record<number, number>; // levelId -> score
  levelStars: Record<number, number>; // levelId -> stars (1-3)
  unlockedLevel: number;
  totalEnergy: number;
  totalNimClaimed: number;
  dailyStreak: number;
  lastDailyDate: string;
  soundMuted: boolean;
  soundVolume: number;
}

const DEFAULT_PROGRESS: UserProgress = {
  highScores: {},
  levelStars: {},
  unlockedLevel: 1,
  totalEnergy: 0,
  totalNimClaimed: 0,
  dailyStreak: 0,
  lastDailyDate: '',
  soundMuted: false,
  soundVolume: 0.6,
};

export class StorageService {
  private static STORAGE_KEY = 'dynamio_progress_v1';

  public static getProgress(): UserProgress {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load progress', e);
    }
    return { ...DEFAULT_PROGRESS };
  }

  public static saveProgress(progress: UserProgress) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }

  public static recordLevelCompletion(levelId: number, score: number, targetScore: number, energyEarned: number, nimEarned: number) {
    const p = this.getProgress();

    // High score
    const currentBest = p.highScores[levelId] || 0;
    if (score > currentBest) {
      p.highScores[levelId] = score;
    }

    // Stars (1 star = won, 2 stars = score >= 75% target, 3 stars = score >= 100% target)
    let stars = 1;
    if (score >= targetScore) stars = 3;
    else if (score >= targetScore * 0.75) stars = 2;

    p.levelStars[levelId] = Math.max(p.levelStars[levelId] || 0, stars);

    // Unlock next level
    if (levelId === p.unlockedLevel && p.unlockedLevel < 7) {
      p.unlockedLevel = levelId + 1;
    }

    // Currency
    p.totalEnergy += energyEarned;
    p.totalNimClaimed += nimEarned;

    this.saveProgress(p);
  }

  public static recordDailyChallenge(dateString: string, score: number, energyEarned: number, nimEarned: number) {
    const p = this.getProgress();
    if (p.lastDailyDate !== dateString) {
      // Check if consecutive day
      p.dailyStreak += 1;
      p.lastDailyDate = dateString;
    }
    p.totalEnergy += energyEarned;
    p.totalNimClaimed += nimEarned;
    this.saveProgress(p);
  }
}
