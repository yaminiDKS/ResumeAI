
export interface ResumeAnalysis {
  matchScore: number;
  marketInsights: string[];
  missingKeywords: string[];
  suggestedSkills: string[];
  improvementSummary: string;
  optimizedResumeLatex: string;
}

export interface ResearchResult {
  trends: string;
  groundingLinks: string[];
}

export type AppState = 'idle' | 'researching' | 'thinking' | 'complete' | 'error';
