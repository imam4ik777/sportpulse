// frontend/src/entities/match/api.ts
import api, { fetchWithCache } from '@/shared/api/base';
import { Match, MatchFilters } from './types';

// Получение матчей в прямом эфире
export const getLiveMatches = async (): Promise<Match[]> => {
  try {
    return await fetchWithCache<Match[]>('/matches/live', 'liveMatches');
  } catch (err) {
    console.error('Ошибка при загрузке live матчей:', err);
    return [];
  }
};

// Получение предстоящих матчей с опциональными фильтрами
export const getUpcomingMatches = async (filters?: MatchFilters): Promise<Match[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters?.tournament) queryParams.append('tournament', filters.tournament);
    if (filters?.period) queryParams.append('period', filters.period);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const endpoint = `/matches/upcoming?${queryParams.toString()}`;
    return await fetchWithCache<Match[]>(endpoint, `upcomingMatches-${queryParams.toString() || 'all'}`);
  } catch (err) {
    console.error('Ошибка при загрузке предстоящих матчей:', err);
    return [];
  }
};

// Получение завершенных матчей с опциональными фильтрами
export const getFinishedMatches = async (filters?: MatchFilters): Promise<Match[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters?.tournament) queryParams.append('tournament', filters.tournament);
    if (filters?.date) queryParams.append('date', filters.date);
    if (filters?.period) queryParams.append('period', filters.period);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const endpoint = `/matches/finished?${queryParams.toString()}`;
    return await fetchWithCache<Match[]>(endpoint, `finishedMatches-${queryParams.toString() || 'all'}`);
  } catch (err) {
    console.error('Ошибка при загрузке завершенных матчей:', err);
    return [];
  }
};

// Получение популярных матчей для главной страницы
export const getPopularMatches = async (limit: number = 5): Promise<Match[]> => {
  try {
    return await fetchWithCache<Match[]>(`/matches/popular?limit=${limit}`, `popularMatches-${limit}`);
  } catch (err) {
    console.error('Ошибка при загрузке популярных матчей:', err);
    return [];
  }
};