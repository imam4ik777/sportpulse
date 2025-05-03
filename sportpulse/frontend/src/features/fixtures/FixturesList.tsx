'use client';

import React, { useEffect, useState } from 'react';
import { fetchFixturesByDate } from '@/shared/api/sportmonks';
import MatchCard from '@/shared/ui/MatchCard/MatchCard';
import './FixturesList.css';

interface Fixture {
  id: number;
  starting_at: {
    date_time: string;
  };
  participants: {
    data: {
      id: number;
      name: string;
    }[];
  };
  league: {
    data: {
      name: string;
    };
  };
  scores?: {
    data: {
      score: {
        participant: string;
        goals: number;
      }[];
    }
  };
}

interface FixturesListProps {
  date?: string; // Если не указана, используется текущая дата с годом 2025
}

const FixturesList: React.FC<FixturesListProps> = ({ date }) => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // date может быть уже в формате YYYY-MM-DD или null/undefined
        const response = await fetchFixturesByDate(date);
        setFixtures(response.data || []);
      } catch (err) {
        console.error('Ошибка при загрузке матчей:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date]);

  // Конвертация данных API в формат наших компонентов
  const mapFixturesToMatches = (fixtures: Fixture[]) => {
    return fixtures.map(fixture => {
      // Получаем команды
      const homeTeam = fixture.participants.data?.[0]?.name || 'Неизвестно';
      const awayTeam = fixture.participants.data?.[1]?.name || 'Неизвестно';
      
      // Получаем счет, если есть
      const homeScore = fixture.scores?.data?.score?.find(s => s.participant === 'home')?.goals;
      const awayScore = fixture.scores?.data?.score?.find(s => s.participant === 'away')?.goals;
      
      // Форматируем время из API (уже в московской временной зоне)
      const dateObj = new Date(fixture.starting_at.date_time);
      const time = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      
      return {
        id: fixture.id.toString(),
        home: homeTeam,
        away: awayTeam,
        status: 'UPCOMING' as const,
        time,
        date: formattedDate,
        tournament: fixture.league.data?.name,
        score: homeScore !== undefined && awayScore !== undefined ? {
          home: homeScore,
          away: awayScore
        } : undefined
      };
    });
  };

  const matchesData = mapFixturesToMatches(fixtures);

  if (isLoading) {
    return <div className="fixtures-loading">Загрузка матчей...</div>;
  }

  if (error) {
    return <div className="fixtures-error">❌ Ошибка: {error}</div>;
  }

  if (fixtures.length === 0) {
    return <div className="fixtures-empty">На выбранную дату нет матчей</div>;
  }

  return (
    <div className="fixtures-list">
      <h2 className="fixtures-title">⚽ Матчи по МСК</h2>
      <div className="fixtures-grid">
        {matchesData.map(match => (
          <MatchCard
            key={match.id}
            homeTeam={match.home}
            awayTeam={match.away}
            status="UPCOMING"
            time={match.time}
            date={match.date}
            tournament={match.tournament}
            homeScore={match.score?.home}
            awayScore={match.score?.away}
          />
        ))}
      </div>
    </div>
  );
};

export default FixturesList; 