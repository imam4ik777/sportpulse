import React, { useEffect, useState } from 'react';
import { getLiveMatches } from '@/entities/match/api';  // Или твой импорт
import { Match } from '@/entities/match/types';

const MatchList = () => {
  const [matches, setMatches] = useState<Match[]>([]);

  // Функция для получения матчей с кэшированием в localStorage
  const fetchMatches = async () => {
    // Проверяем, есть ли данные в localStorage
    const cachedMatches = localStorage.getItem('matches');

    if (cachedMatches) {
      // Если данные есть, парсим их и возвращаем
      console.log('Загружены данные из localStorage');
      return JSON.parse(cachedMatches);
    }

    // Если данных нет, делаем запрос к серверу
    try {
      const data = await getLiveMatches();
      // Сохраняем данные в localStorage
      localStorage.setItem('matches', JSON.stringify(data));
      console.log('Данные получены с сервера и сохранены в localStorage');
      return data;
    } catch (err) {
      console.error('Ошибка при запросе матчей:', err);
      return [];
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchMatches();
        setMatches(data);
      } catch (err) {
        console.error('Ошибка при загрузке матчей:', err);
      }
    };

    fetch();
    const interval = setInterval(fetch, 60000);  // Обновление данных каждые 60 секунд
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {matches.length === 0 ? (
        <p>Загрузка...</p>
      ) : (
        matches.map((match, idx) => (
          <div
            key={idx}
            className="card bg-dark text-white mb-2 p-3 d-flex flex-row justify-content-between align-items-center"
          >
            <span>{match.home}</span>
            <span className="text-danger fw-bold">LIVE</span>
            <span>{match.away}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default MatchList;