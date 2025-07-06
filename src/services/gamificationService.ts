/**
 * Gamification Service for SpeakSync
 * Handles achievements, streaks, progress tracking, and XP system
 */

import {
  UserProgress,
  Achievement,
  UserStreak,
  ProgressStats,
  ProgressTrend,
  ProgressDataPoint,
  AchievementRequirement,
  SocialShare,
  WeeklyGoal,
  GamificationData,
  SessionSummaryReport
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analyticsService';

const STORAGE_KEYS = {
  USER_PROGRESS: '@speaksync/user_progress',
  ACHIEVEMENTS: '@speaksync/achievements',
  STREAKS: '@speaksync/streaks',
  WEEKLY_GOALS: '@speaksync/weekly_goals',
  GAMIFICATION_SETTINGS: '@speaksync/gamification_settings'
};

// Predefined achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first practice session',
    icon: '🎯',
    category: 'sessions',
    requirement: { type: 'sessions_count', target: 1 },
    isSecret: false,
    rarity: 'common',
    points: 50
  },
  {
    id: 'sessions_10',
    name: 'Getting Started',
    description: 'Complete 10 practice sessions',
    icon: '📈',
    category: 'sessions',
    requirement: { type: 'sessions_count', target: 10 },
    isSecret: false,
    rarity: 'common',
    points: 200
  },
  {
    id: 'sessions_50',
    name: 'Dedicated Speaker',
    description: 'Complete 50 practice sessions',
    icon: '🌟',
    category: 'sessions',
    requirement: { type: 'sessions_count', target: 50 },
    isSecret: false,
    rarity: 'rare',
    points: 750
  },
  {
    id: 'sessions_100',
    name: 'Master Speaker',
    description: 'Complete 100 practice sessions',
    icon: '👑',
    category: 'sessions',
    requirement: { type: 'sessions_count', target: 100 },
    isSecret: false,
    rarity: 'epic',
    points: 1500
  },
  {
    id: 'wpm_150',
    name: 'Speed Demon',
    description: 'Achieve 150 WPM in a session',
    icon: '⚡',
    category: 'performance',
    requirement: { type: 'wpm_target', target: 150 },
    isSecret: false,
    rarity: 'rare',
    points: 500
  },
  {
    id: 'wpm_200',
    name: 'Lightning Speaker',
    description: 'Achieve 200 WPM in a session',
    icon: '🚀',
    category: 'performance',
    requirement: { type: 'wpm_target', target: 200 },
    isSecret: false,
    rarity: 'epic',
    points: 1000
  },
  {
    id: 'filler_crusher',
    name: 'Filler Word Crusher',
    description: 'Achieve less than 2 filler words per minute',
    icon: '🎯',
    category: 'performance',
    requirement: { type: 'filler_reduction', target: 2 },
    isSecret: false,
    rarity: 'rare',
    points: 600
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Practice for 7 days in a row',
    icon: '🔥',
    category: 'consistency',
    requirement: { type: 'streak_days', target: 7 },
    isSecret: false,
    rarity: 'rare',
    points: 800
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Practice for 30 days in a row',
    icon: '💎',
    category: 'consistency',
    requirement: { type: 'streak_days', target: 30 },
    isSecret: false,
    rarity: 'legendary',
    points: 2500
  },
  {
    id: 'first_bilingual',
    name: 'Bilingual Speaker',
    description: 'Practice in at least 2 different languages',
    icon: '🌍',
    category: 'language',
    requirement: { type: 'languages_used', target: 2 },
    isSecret: false,
    rarity: 'rare',
    points: 700
  },
  {
    id: 'polyglot',
    name: 'Polyglot Master',
    description: 'Practice in 5 different languages',
    icon: '🗣️',
    category: 'language',
    requirement: { type: 'languages_used', target: 5 },
    isSecret: false,
    rarity: 'legendary',
    points: 2000
  },
  {
    id: 'master_pacer',
    name: 'Master Pacer',
    description: 'Maintain consistent pacing (>85% adherence) for 10 sessions',
    icon: '⏱️',
    category: 'consistency',
    requirement: { 
      type: 'consistency_score', 
      target: 85,
      conditions: { sessions_count: 10 }
    },
    isSecret: false,
    rarity: 'epic',
    points: 1200
  },
  {
    id: 'marathon_speaker',
    name: 'Marathon Speaker',
    description: 'Complete a 60-minute practice session',
    icon: '🏃‍♂️',
    category: 'milestones',
    requirement: { 
      type: 'total_time', 
      target: 60,
      timeframe: 'daily',
      conditions: { single_session: true }
    },
    isSecret: false,
    rarity: 'epic',
    points: 1000
  }
];

interface GamificationSettings {
  enableAchievements: boolean;
  enableStreaks: boolean;
  enableXP: boolean;
  enableWeeklyGoals: boolean;
  showProgressGraphs: boolean;
  allowSocialSharing: boolean;
}

class GamificationService {
  private static instance: GamificationService;
  private userProgress: UserProgress | null = null;
  private userAchievements: Achievement[] = [];
  private userStreaks: UserStreak[] = [];
  private weeklyGoals: WeeklyGoal[] = [];
  private settings: GamificationSettings;

  private constructor() {
    this.settings = {
      enableAchievements: true,
      enableStreaks: true,
      enableXP: true,
      enableWeeklyGoals: true,
      showProgressGraphs: true,
      allowSocialSharing: true
    };
    this.loadGamificationData();
  }

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // Initialization
  private async loadGamificationData(): Promise<void> {
    try {
      const [progress, achievements, streaks, goals, settings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.STREAKS),
        AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.GAMIFICATION_SETTINGS)
      ]);

      if (progress) {
        this.userProgress = JSON.parse(progress);
      } else {
        this.userProgress = this.createDefaultProgress();
      }

      if (achievements) {
        this.userAchievements = JSON.parse(achievements);
      }

      if (streaks) {
        this.userStreaks = JSON.parse(streaks);
      } else {
        this.userStreaks = [this.createDefaultStreak('daily'), this.createDefaultStreak('weekly')];
      }

      if (goals) {
        this.weeklyGoals = JSON.parse(goals);
      } else {
        this.weeklyGoals = this.generateWeeklyGoals();
      }

      if (settings) {
        this.settings = { ...this.settings, ...JSON.parse(settings) };
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
      this.initializeDefaults();
    }
  }

  private createDefaultProgress(): UserProgress {
    return {
      level: 1,
      totalXP: 0,
      xpToNextLevel: 100,
      totalSessions: 0,
      totalTimeMinutes: 0,
      achievements: [],
      streaks: [],
      stats: {
        averageWPM: 0,
        bestWPM: 0,
        fillerWordRate: 0,
        consistencyScore: 0,
        languagesUsed: [],
        improvementTrends: []
      }
    };
  }

  private createDefaultStreak(type: 'daily' | 'weekly'): UserStreak {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: new Date(),
      streakType: type,
      isActive: false
    };
  }

  private initializeDefaults(): void {
    this.userProgress = this.createDefaultProgress();
    this.userAchievements = [];
    this.userStreaks = [this.createDefaultStreak('daily'), this.createDefaultStreak('weekly')];
    this.weeklyGoals = this.generateWeeklyGoals();
  }

  // Progress Management
  async updateProgressFromSession(sessionReport: SessionSummaryReport): Promise<void> {
    if (!this.userProgress) return;

    const sessionDuration = sessionReport.endTime - sessionReport.startTime;
    const sessionWPM = sessionReport.averageWPM;
    const fillerRate = (sessionReport.fillerWords.length / (sessionDuration / 60000)); // per minute

    // Update basic stats
    this.userProgress.totalSessions += 1;
    this.userProgress.totalTimeMinutes += Math.round(sessionDuration / 60000); // Convert to minutes

    // Update performance stats
    this.userProgress.stats.averageWPM = this.calculateNewAverage(
      this.userProgress.stats.averageWPM,
      sessionWPM,
      this.userProgress.totalSessions
    );

    if (sessionWPM > this.userProgress.stats.bestWPM) {
      this.userProgress.stats.bestWPM = sessionWPM;
    }

    this.userProgress.stats.fillerWordRate = this.calculateNewAverage(
      this.userProgress.stats.fillerWordRate,
      fillerRate,
      this.userProgress.totalSessions
    );

    // Calculate consistency score based on optimal percentage
    const adherence = sessionReport.optimalPercentage;
    this.userProgress.stats.consistencyScore = this.calculateNewAverage(
      this.userProgress.stats.consistencyScore,
      adherence,
      this.userProgress.totalSessions
    );

    // Track language usage - would need to be added to SessionSummaryReport
    // For now, we'll skip this until the type is extended

    // Award XP
    const xpEarned = this.calculateXPFromSession(sessionReport);
    await this.awardXP(xpEarned);

    // Update streaks
    await this.updateStreaks();

    // Check for new achievements
    await this.checkAndUnlockAchievements(sessionReport);

    // Update weekly goals
    await this.updateWeeklyGoals(sessionReport);

    // Save progress
    await this.saveProgress();
  }

  private calculateNewAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  private calculateXPFromSession(sessionReport: SessionSummaryReport): number {
    let baseXP = 20; // Base XP for completing a session
    
    // Bonus XP for performance
    const wpmBonus = Math.floor(sessionReport.averageWPM / 10) * 2;
    const adherenceBonus = Math.floor(sessionReport.optimalPercentage / 10) * 3;
    const durationBonus = Math.floor((sessionReport.endTime - sessionReport.startTime) / 60000) * 5;
    
    // Penalty for high filler words
    const fillerPenalty = sessionReport.fillerWords.length * 2;
    
    return Math.max(10, baseXP + wpmBonus + adherenceBonus + durationBonus - fillerPenalty);
  }

  async awardXP(amount: number): Promise<void> {
    if (!this.userProgress) return;

    this.userProgress.totalXP += amount;
    
    // Check for level up
    while (this.userProgress.totalXP >= this.userProgress.xpToNextLevel) {
      this.userProgress.level += 1;
      this.userProgress.totalXP -= this.userProgress.xpToNextLevel;
      this.userProgress.xpToNextLevel = this.calculateXPForLevel(this.userProgress.level + 1);
      
      // Award achievement for level milestones
      if (this.userProgress.level % 5 === 0) {
        // Could add level-based achievements here
      }
    }
  }

  private calculateXPForLevel(level: number): number {
    return 100 + (level - 1) * 50; // Increasing XP requirement
  }

  // Streak Management
  private async updateStreaks(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const streak of this.userStreaks) {
      const lastPractice = new Date(streak.lastPracticeDate);
      lastPractice.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24));

      if (streak.streakType === 'daily') {
        if (daysDiff === 0) {
          // Same day, no change
          continue;
        } else if (daysDiff === 1) {
          // Consecutive day
          streak.currentStreak += 1;
          streak.isActive = true;
        } else {
          // Streak broken
          if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
          }
          streak.currentStreak = 1;
          streak.isActive = false;
        }
      } else if (streak.streakType === 'weekly') {
        // Weekly streak logic (simplified)
        const weeksDiff = Math.floor(daysDiff / 7);
        if (weeksDiff === 0) {
          continue;
        } else if (weeksDiff === 1) {
          streak.currentStreak += 1;
          streak.isActive = true;
        } else {
          if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
          }
          streak.currentStreak = 1;
          streak.isActive = false;
        }
      }

      streak.lastPracticeDate = today;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(this.userStreaks));
  }

  // Achievement System
  private async checkAndUnlockAchievements(sessionReport: SessionSummaryReport): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (this.userAchievements.find(a => a.id === achievement.id)) {
        continue; // Already unlocked
      }

      if (await this.isAchievementUnlocked(achievement, sessionReport)) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date()
        };
        
        this.userAchievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
        
        // Award XP for achievement
        await this.awardXP(achievement.points);
      }
    }

    if (newAchievements.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.userAchievements));
    }

    return newAchievements;
  }

  private async isAchievementUnlocked(achievement: Achievement, sessionReport: SessionSummaryReport): Promise<boolean> {
    if (!this.userProgress) return false;

    const req = achievement.requirement;

    switch (req.type) {
      case 'sessions_count':
        return this.userProgress.totalSessions >= req.target;
      
      case 'wpm_target':
        return sessionReport.averageWPM >= req.target;
      
      case 'filler_reduction':
        const fillerRate = (sessionReport.fillerWords.length / ((sessionReport.endTime - sessionReport.startTime) / 60000));
        return fillerRate <= req.target;
      
      case 'streak_days':
        const dailyStreak = this.userStreaks.find(s => s.streakType === 'daily');
        return dailyStreak ? dailyStreak.currentStreak >= req.target : false;
      
      case 'languages_used':
        return this.userProgress.stats.languagesUsed.length >= req.target;
      
      case 'total_time':
        if (req.conditions?.single_session) {
          return ((sessionReport.endTime - sessionReport.startTime) / 60000) >= req.target;
        }
        return this.userProgress.totalTimeMinutes >= req.target;
      
      case 'consistency_score':
        if (req.conditions?.sessions_count) {
          // Check last N sessions for consistency
          return this.userProgress.stats.consistencyScore >= req.target &&
                 this.userProgress.totalSessions >= req.conditions.sessions_count;
        }
        return this.userProgress.stats.consistencyScore >= req.target;
      
      default:
        return false;
    }
  }

  // Weekly Goals
  private generateWeeklyGoals(): WeeklyGoal[] {
    const weekStart = this.getWeekStart(new Date());
    
    return [
      {
        id: 'sessions_goal',
        type: 'sessions',
        target: 5,
        current: 0,
        description: 'Complete 5 practice sessions this week',
        xpReward: 100,
        isCompleted: false,
        weekStart
      },
      {
        id: 'time_goal',
        type: 'time',
        target: 120, // 2 hours
        current: 0,
        description: 'Practice for 2 hours this week',
        xpReward: 150,
        isCompleted: false,
        weekStart
      },
      {
        id: 'improvement_goal',
        type: 'improvement',
        target: 5, // 5% improvement in consistency
        current: 0,
        description: 'Improve your consistency by 5%',
        xpReward: 200,
        isCompleted: false,
        weekStart
      }
    ];
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private async updateWeeklyGoals(sessionReport: SessionSummaryReport): Promise<void> {
    const currentWeek = this.getWeekStart(new Date());
    
    // Check if we need new goals for this week
    if (this.weeklyGoals.length === 0 || this.weeklyGoals[0].weekStart < currentWeek) {
      this.weeklyGoals = this.generateWeeklyGoals();
    }

    // Update goal progress
    for (const goal of this.weeklyGoals) {
      if (goal.isCompleted) continue;

      switch (goal.type) {
        case 'sessions':
          goal.current += 1;
          break;
        case 'time':
          goal.current += Math.round((sessionReport.endTime - sessionReport.startTime) / 60000);
          break;
        case 'improvement':
          // Calculate improvement based on recent performance
          const consistencyImprovement = this.calculateConsistencyImprovement();
          goal.current = Math.max(goal.current, consistencyImprovement);
          break;
      }

      if (goal.current >= goal.target && !goal.isCompleted) {
        goal.isCompleted = true;
        await this.awardXP(goal.xpReward);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_GOALS, JSON.stringify(this.weeklyGoals));
  }

  private calculateConsistencyImprovement(): number {
    // Simplified calculation - would need historical data
    return Math.random() * 10; // Mock improvement percentage
  }

  // Data Access
  async getUserProgress(): Promise<UserProgress | null> {
    return this.userProgress;
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.userAchievements;
  }

  async getStreaks(): Promise<UserStreak[]> {
    return this.userStreaks;
  }

  async getWeeklyGoals(): Promise<WeeklyGoal[]> {
    return this.weeklyGoals;
  }

  async getGamificationData(): Promise<GamificationData> {
    if (!this.userProgress) {
      this.userProgress = this.createDefaultProgress();
    }

    const recentAchievements = this.userAchievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 5);

    const activeStreaks = this.userStreaks.filter(s => s.isActive);

    return {
      currentLevel: this.userProgress.level,
      totalXP: this.userProgress.totalXP,
      weeklyXP: this.calculateWeeklyXP(),
      monthlyXP: this.calculateMonthlyXP(),
      recentAchievements,
      activeStreaks,
      weeklyGoals: this.weeklyGoals
    };
  }

  private calculateWeeklyXP(): number {
    // Would need to track XP gains with timestamps
    return Math.floor(Math.random() * 500); // Mock weekly XP
  }

  private calculateMonthlyXP(): number {
    // Would need to track XP gains with timestamps
    return Math.floor(Math.random() * 2000); // Mock monthly XP
  }

  // Social Sharing
  async generateSocialShare(achievementId: string, platform: SocialShare['platform']): Promise<SocialShare> {
    const achievement = this.userAchievements.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const messages = {
      twitter: `Just unlocked "${achievement.name}" ${achievement.icon} in @SpeakSync! ${achievement.description} #PublicSpeaking #Achievement`,
      linkedin: `Excited to share that I've unlocked the "${achievement.name}" achievement in SpeakSync! ${achievement.description}`,
      facebook: `🎉 Just achieved "${achievement.name}" in my public speaking practice with SpeakSync! ${achievement.description}`,
      instagram: `${achievement.icon} New achievement unlocked: "${achievement.name}"! ${achievement.description} #SpeakSync #PublicSpeaking`,
      clipboard: `I just unlocked the "${achievement.name}" achievement in SpeakSync! ${achievement.description}`
    };

    return {
      platform,
      achievementId,
      customMessage: messages[platform],
      includeStats: true,
      imageUrl: `https://api.speaksync.app/achievements/${achievementId}/share.png` // Mock URL
    };
  }

  // Progress Trends
  async getProgressTrends(): Promise<ProgressTrend[]> {
    // This would integrate with analytics service to get historical data
    const mockTrends: ProgressTrend[] = [
      {
        metric: 'wpm',
        timeframe: 'month',
        data: this.generateMockTrendData(30),
        trend: 'improving',
        changePercent: 15.5
      },
      {
        metric: 'filler_rate',
        timeframe: 'month',
        data: this.generateMockTrendData(30),
        trend: 'improving',
        changePercent: -12.3
      },
      {
        metric: 'consistency',
        timeframe: 'month',
        data: this.generateMockTrendData(30),
        trend: 'stable',
        changePercent: 2.1
      }
    ];

    return mockTrends;
  }

  private generateMockTrendData(days: number): ProgressDataPoint[] {
    const data: ProgressDataPoint[] = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      data.push({
        timestamp: now - (i * 24 * 60 * 60 * 1000),
        value: Math.random() * 100 + Math.random() * 20,
        sessionCount: Math.floor(Math.random() * 3)
      });
    }
    
    return data;
  }

  // Save/Load
  private async saveProgress(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(this.userProgress)),
        AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.userAchievements)),
        AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(this.userStreaks)),
        AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_GOALS, JSON.stringify(this.weeklyGoals))
      ]);
    } catch (error) {
      console.error('Failed to save gamification progress:', error);
    }
  }

  // Settings
  async updateSettings(settings: Partial<GamificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.GAMIFICATION_SETTINGS, JSON.stringify(this.settings));
  }

  getSettings(): GamificationSettings {
    return this.settings;
  }
}

export default GamificationService;
