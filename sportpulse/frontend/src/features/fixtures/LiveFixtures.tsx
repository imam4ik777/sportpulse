'use client';

import React, { useEffect, useState } from 'react';
import { fetchLiveFixtures } from '@/shared/api/sportmonks';
import { getLiveMatches, getLiveMatchesWithRetry } from '@/shared/api/live';
import MatchCard from '@/shared/ui/MatchCard/MatchCard';
import './FixturesList.css';

interface FixtureData {
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
    };
  };
}

// Функция для получения live-матчей через прямой эндпоинт (если доступен)
const fetchLiveFixturesDirect = async () => {
  try {
    // Получаем текущий часовой пояс пользователя
    const timezone = localStorage.getItem('userTimezone') || 'auto';
    const actualTimezone = timezone === 'auto' 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone 
      : timezone;
      
    // Формируем правильный URL с эндпоинтом livescores
    const url = `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=SGOwv7vqpd5vWfjM1KVH8vnICMSNBivrBmlMJA7xFq51TTN5ttYqcD82XZns&timezone=${actualTimezone}&include=participants;league;venue;scores`;
    
    console.log(`Прямой запрос к API: ${url}`);
    
    // Добавляем таймаут
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Ошибка при запросе: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Превышено время ожидания запроса к SportMonks API');
      }
      
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('Ошибка при прямом запросе live-матчей:', error);
    // Возвращаем пустые данные при ошибке
    return { data: [] };
  }
};

// Функция для проверки доступности сети
const checkNetworkConnection = () => {
  return navigator.onLine;
};

// Функция для проверки доступности API
const checkApiAvailability = async () => {
  try {
    // Пытаемся получить простой ответ от сервера
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Проверяем с помощью основного эндпоинта, а не /api/healthcheck
    const response = await fetch('/api/live?timezone=Europe/Moscow', { 
      signal: controller.signal,
      method: 'HEAD' 
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Ошибка при проверке доступности API:', error);
    return false;
  }
};

const LiveFixtures: React.FC = () => {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  // Добавляем проверку сети при загрузке компонента
  useEffect(() => {
    const handleNetworkChange = () => {
      const isOnline = checkNetworkConnection();
      setNetworkStatus(isOnline ? 'online' : 'offline');
      console.log(`Статус сети изменился: ${isOnline ? 'online' : 'offline'}`);
    };

    // Проверяем текущий статус сети
    handleNetworkChange();
    
    // Проверяем доступность API
    checkApiAvailability().then(isAvailable => {
      setApiAvailable(isAvailable);
      console.log(`API ${isAvailable ? 'доступно' : 'недоступно'}`);
    });

    // Добавляем слушатели событий сети
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Если нет интернет-соединения, показываем ошибку
      if (networkStatus === 'offline') {
        console.log('Нет интернет-соединения');
        setError('Отсутствует интернет-соединение. Проверьте подключение к сети.');
        setDataSource('offline');
        setLastUpdated(new Date());
        setIsLoading(false);
        return;
      }
      
      // Если API недоступно, показываем ошибку
      if (!apiAvailable) {
        console.log('API недоступно');
        setError('Сервер API недоступен. Попробуйте позже.');
        setDataSource('api-unavailable');
        setLastUpdated(new Date());
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Запрашиваем live-матчи...');
        
        // Используем новую функцию с повторными попытками
        let response;
        try {
          console.log('Используем оптимизированный API с автоматическими повторами...');
          response = await getLiveMatchesWithRetry(2, 2000); // 2 повторные попытки с интервалом 2 секунды
          console.log('Получены данные через оптимизированный API с повторами');
          setDataSource('optimized-retry');
        } catch (optimizedError: unknown) {
          console.warn('Оптимизированный API недоступен, пробуем прямой эндпоинт...', optimizedError);
          
          // Если оптимизированный метод недоступен, пробуем прямой эндпоинт через прокси
          try {
            response = await fetchLiveFixtures();
            console.log('Получены данные через прокси');
            setDataSource('proxy');
          } catch (proxyError: unknown) {
            // Все попытки не удались, показываем ошибку
            console.error('Все методы запроса недоступны:', proxyError);
            throw new Error('Не удалось получить данные о live-матчах. Пожалуйста, повторите позже.');
          }
        }
        
        // Обновляем время последнего успешного запроса
        setLastUpdated(new Date());
        
        // Детальное логирование
        if (response.data && Array.isArray(response.data)) {
          console.log(`Найдено ${response.data.length} live-матчей`);
          if (response.data.length > 0) {
            const firstMatch = response.data[0];
            console.log('Пример матча:', {
              id: firstMatch.id,
              name: firstMatch.name,
              starting_at: firstMatch.starting_at,
              teams: firstMatch.participants?.map((team: any) => team.name) || [],
              league: firstMatch.league?.name || 'Неизвестная лига',
              scores: firstMatch.scores || []
            });
          }
        }
        
        setFixtures(response.data || []);
        setRetryCount(0); // Сбрасываем счетчик при успешном запросе
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке live-матчей:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        
        // Увеличиваем счетчик ошибок
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        // Если ошибка повторяется слишком часто, помечаем API как недоступный
        if (newRetryCount > 5) {
          setApiAvailable(false);
          setDataSource('api-error');
          setError('Сервис временно недоступен. Попробуйте позже.');
        } else {
          setDataSource('error');
        }
        
        // Устанавливаем пустые данные
        setFixtures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Обновляем данные каждые 15 секунд
    const interval = setInterval(fetchData, 15000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [networkStatus, apiAvailable, retryCount]);

  // Функция для ручного обновления данных
  const handleRefresh = () => {
    setIsLoading(true);
    // Восстанавливаем все состояния как перед первой загрузкой
    setDataSource('loading');
    setError(null);
    
    // Запускаем эффект загрузки данных
    const fetchAgain = async () => {
      try {
        const response = await getLiveMatchesWithRetry(1, 1000);
        setFixtures(response.data || []);
        setDataSource('optimized-retry');
        setLastUpdated(new Date());
        setError(null);
      } catch (err: unknown) {
        console.error('Ошибка при ручном обновлении:', err);
        setError(`Не удалось обновить данные: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
        setFixtures([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgain();
  };

  // Конвертация данных API в формат наших компонентов
  const mapFixturesToMatches = (fixtures: FixtureData[] | any[]) => {
    return fixtures.map(fixture => {
      // Проверка и адаптация к разным форматам API
      console.log('Структура матча:', JSON.stringify(fixture).substring(0, 200) + '...');
      
      // Получаем команды, адаптируясь к разным форматам API
      let homeTeam = 'Неизвестно';
      let awayTeam = 'Неизвестно';
      
      if (fixture.participants) {
        if (Array.isArray(fixture.participants)) {
          // Формат из API livescores/inplay (массив)
          const homeTeamObj = fixture.participants.find((p: any) => p.meta?.location === 'home');
          const awayTeamObj = fixture.participants.find((p: any) => p.meta?.location === 'away');
          homeTeam = homeTeamObj?.name || 'Неизвестно';
          awayTeam = awayTeamObj?.name || 'Неизвестно';
        } else if (fixture.participants.data) {
          // Формат с data (как в нашем старом интерфейсе)
          homeTeam = fixture.participants.data[0]?.name || 'Неизвестно';
          awayTeam = fixture.participants.data[1]?.name || 'Неизвестно';
        }
      }
      
      // Получаем счет, адаптируясь к разным форматам
      let homeScore = 0;
      let awayScore = 0;
      
      if (fixture.scores) {
        if (Array.isArray(fixture.scores)) {
          // Формат из API livescores/inplay (массив с объектами score)
          const currentScores = fixture.scores.filter((s: any) => s.description === 'CURRENT');
          if (currentScores.length > 0) {
            const homeScoreObj = currentScores.find((s: any) => s.score?.participant === 'home');
            const awayScoreObj = currentScores.find((s: any) => s.score?.participant === 'away');
            homeScore = homeScoreObj?.score?.goals || 0;
            awayScore = awayScoreObj?.score?.goals || 0;
          }
        } else if (fixture.scores.data && fixture.scores.data.score) {
          // Формат с data.score (как в нашем старом интерфейсе)
          homeScore = fixture.scores.data.score.find((s: { participant: string; goals: number }) => s.participant === 'home')?.goals || 0;
          awayScore = fixture.scores.data.score.find((s: { participant: string; goals: number }) => s.participant === 'away')?.goals || 0;
        }
      }
      
      // Получаем название лиги, адаптируясь к разным форматам
      let tournament = 'Неизвестная лига';
      
      if (fixture.league) {
        if (typeof fixture.league === 'string') {
          tournament = fixture.league;
        } else if (fixture.league.name) {
          tournament = fixture.league.name;
        } else if (fixture.league.data && fixture.league.data.name) {
          tournament = fixture.league.data.name;
        }
      }
      
      // Форматируем дату, адаптируясь к разным форматам
      let formattedDate = '';
      
      if (fixture.starting_at) {
        const dateString = typeof fixture.starting_at === 'string' 
          ? fixture.starting_at 
          : fixture.starting_at.date_time || fixture.starting_at.date;
          
        try {
          const dateObj = new Date(dateString);
          formattedDate = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        } catch (error) {
          console.error('Ошибка при форматировании даты:', error);
          formattedDate = 'Н/Д';
        }
      }
      
      return {
        id: fixture.id?.toString() || Math.random().toString(),
        home: homeTeam,
        away: awayTeam,
        status: 'LIVE' as const,
        homeScore,
        awayScore,
        date: formattedDate,
        tournament
      };
    });
  };

  const matchesData = mapFixturesToMatches(fixtures);

  if (isLoading && fixtures.length === 0) {
    return <div className="fixtures-loading">Загрузка live-матчей...</div>;
  }

  return (
    <div className="fixtures-list">
      <div className="live-fixtures-header">
        <h2>🔴 Матчи в прямом эфире</h2>
        <div className="update-info">
          {lastUpdated && (
            <span className="last-updated">
              Обновлено: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          {dataSource === 'offline' ? (
            <span className="offline-notice">Офлайн-режим</span>
          ) : dataSource === 'api-unavailable' ? (
            <span className="api-unavailable-notice">API недоступно</span>
          ) : dataSource === 'api-error' ? (
            <span className="api-error-notice">Повторяющиеся ошибки API</span>
          ) : dataSource === 'optimized-retry' ? (
            <span className="optimized-api-notice">Оптимизированное API с повторами</span>
          ) : dataSource === 'proxy' ? (
            <span className="proxy-api-notice">Подключение через прокси</span>
          ) : (
            <span>Автообновление каждые 15 секунд</span>
          )}
          
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Обновляем...' : 'Обновить сейчас'}
          </button>
        </div>
      </div>

      {networkStatus === 'offline' && (
        <div className="network-status-warning">
          ⚠️ Нет подключения к интернету. Отображаются демо-данные.
        </div>
      )}

      {error && (
        <div className="fixtures-error">
          ❌ {error}
          {retryCount > 0 && <span className="retry-info"> (попытка {retryCount})</span>}
        </div>
      )}

      {matchesData.length > 0 ? (
        <div className="fixtures-grid">
          {matchesData.map(match => (
            <MatchCard
              key={match.id}
              homeTeam={match.home}
              awayTeam={match.away}
              status="LIVE"
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              date={match.date}
              tournament={match.tournament}
            />
          ))}
        </div>
      ) : (
        <div className="fixtures-empty">
          <p>В данный момент нет матчей в прямом эфире</p>
          <div className="fixtures-empty-info">
            <h4>Возможные причины:</h4>
            <ul>
              <li>Просто нет активных матчей в текущий момент времени</li>
              <li>API SportMonks может временно не предоставлять данные</li>
              <li>Доступные лиги ограничены вашим тарифным планом API</li>
            </ul>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Проверить снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFixtures;