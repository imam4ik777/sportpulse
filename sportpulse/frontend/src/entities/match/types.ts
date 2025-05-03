export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED';

export type Score = {
  home: number | null;
  away: number | null;
};

export interface Match {
  id: string;
  home: string;
  away: string;
  date: string;
  time?: string;
  status: MatchStatus;
  score?: Score;
  tournament?: string;
  venue?: string;
}

export interface MatchFilters {
  tournament?: string;
  date?: string;
  period?: 'today' | 'tomorrow' | 'week' | 'month';
  page?: number;
  limit?: number;
}