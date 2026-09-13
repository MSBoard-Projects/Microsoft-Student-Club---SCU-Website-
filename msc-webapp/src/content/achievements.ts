export interface StudentAchievement {
  id: string;
  title: string;
  studentNames: readonly string[];
  achievedAt: string | null;
  summary: string;
  imageUrl: string | null;
  evidenceUrl: string | null;
}

export const achievements: readonly StudentAchievement[] = [];