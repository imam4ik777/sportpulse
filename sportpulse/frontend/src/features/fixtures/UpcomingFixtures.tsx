'use client';

import React, { useEffect, useState } from 'react';
import { fetchUpcomingFixtures } from '@/shared/api/sportmonks';
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
}

interface UpcomingFixturesProps {
  days?: number; // Количество дней вперед для показа матчей
}

const UpcomingFixtures: React.FC<UpcomingFixturesProps> = ({ days = 7 }) => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [period, setPeriod] = useState<string>('week');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // API будет использовать 2025 год для всех запросов
        const response = await fetchUpcomingFixtures(days);
        setFixtures(response.data || []);
      } catch (err) {
        console.error('Ошибка при загрузке предстоящих матчей:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [days]);

  // Получаем уникальные турниры из данных
  const tournaments = fixtures
    .map(fixture => fixture.league.data?.name)
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Фильтрация матчей по турниру и периоду
  const filterFixtures = (fixtures: Fixture[]) => {
    let filtered = [...fixtures];
    
    // Фильтрация по турниру
    if (filter !== 'all') {
      filtered = filtered.filter(fixture => fixture.league.data?.name === filter);
    }
    
    // Фильтрация по периоду (примечание: даты будут в 2025 году)
    const now = new Date();
    
    if (period === 'today') {
      filtered = filtered.filter(fixture => {
        const fixtureDate = new Date(fixture.starting_at.date_time);
        return fixtureDate.getDate() === now.getDate() && 
               fixtureDate.getMonth() === now.getMonth();
               // Год не сравниваем, так как API использует 2025
      });
    } else if (period === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(fixture => {
        const fixtureDate = new Date(fixture.starting_at.date_time);
        return fixtureDate.getDate() === tomorrow.getDate() && 
               fixtureDate.getMonth() === tomorrow.getMonth();
               // Год не сравниваем, так как API использует 2025
      });
    }
    // Для периодов 'week' и 'month' не фильтруем дополнительно
    
    return filtered;
  };

  // Конвертация данных API в формат наших компонентов
  const mapFixturesToMatches = (fixtures: Fixture[]) => {
    return fixtures.map(fixture => {
      // Получаем команды
      const homeTeam = fixture.participants.data?.[0]?.name || 'Неизвестно';
      const awayTeam = fixture.participants.data?.[1]?.name || 'Неизвестно';
      
      // Форматируем время из API (даты приходят уже в запрошенном часовом поясе)
      const dateObj = new Date(fixture.starting_at.date_time);
      
      // Простое форматирование без дополнительных преобразований часовых поясов
      const time = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      
      return {
        id: fixture.id.toString(),
        home: homeTeam,
        away: awayTeam,
        status: 'UPCOMING' as const,
        time,
        date: formattedDate,
        tournament: fixture.league.data?.name
      };
    });
  };

  const filteredFixtures = filterFixtures(fixtures);
  const matchesData = mapFixturesToMatches(filteredFixtures);

  if (isLoading) {
    return <div className="fixtures-loading">Загрузка предстоящих матчей...</div>;
  }

  if (error) {
    return <div className="fixtures-error">❌ Ошибка: {error}</div>;
  }

  return (
    <div className="fixtures-list">
      <div className="upcoming-filter">
        <div className="filter-group">
          <span className="filter-label">Фильтр по турнирам:</span>
          <div className="filter-options">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            {tournaments.map((tournament) => (
              <button
                key={tournament}
                className={`filter-btn ${filter === tournament ? 'active' : ''}`}
                onClick={() => setFilter(tournament)}
              >
                {tournament}
              </button>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <span className="filter-label">Период:</span>
          <div className="filter-options">
            <button 
              className={`filter-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => setPeriod('today')}
            >
              Сегодня
            </button>
            <button 
              className={`filter-btn ${period === 'tomorrow' ? 'active' : ''}`}
              onClick={() => setPeriod('tomorrow')}
            >
              Завтра
            </button>
            <button 
              className={`filter-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Неделя
            </button>
            <button 
              className={`filter-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Месяц
            </button>
          </div>
        </div>
      </div>

      {matchesData.length > 0 ? (
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
            />
          ))}
        </div>
      ) : (
        <div className="fixtures-empty">На выбранный период нет предстоящих матчей</div>
      )}
    </div>
  );
};

export default UpcomingFixtures; 