import api, { fetchWithCache } from '@/shared/api/base';
import { Team, TeamFilters } from './types';

// Получение списка команд с фильтрацией
export const getTeams = async (filters?: TeamFilters): Promise<Team[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters?.name) queryParams.append('name', filters.name);
    if (filters?.league) queryParams.append('league', filters.league);
    if (filters?.country) queryParams.append('country', filters.country);
    if (filters?.letter) queryParams.append('letter', filters.letter);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const endpoint = `/teams?${queryParams.toString()}`;
    return await fetchWithCache<Team[]>(endpoint, `teams-${queryParams.toString() || 'all'}`);
  } catch (err) {
    console.error('Ошибка при загрузке команд:', err);
    return [];
  }
};

// Получение популярных команд для главной страницы
export const getPopularTeams = async (limit: number = 5): Promise<Team[]> => {
  try {
    return await fetchWithCache<Team[]>(`/teams/popular?limit=${limit}`, `popularTeams-${limit}`);
  } catch (err) {
    console.error('Ошибка при загрузке популярных команд:', err);
    return [];
  }
};

// Получение детальной информации о команде
export const getTeamById = async (id: string): Promise<Team | null> => {
  try {
    return await fetchWithCache<Team>(`/teams/${id}`, `team-${id}`);
  } catch (err) {
    console.error(`Ошибка при загрузке информации о команде ${id}:`, err);
    return null;
  }
};