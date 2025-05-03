import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLiveMatches } from '@/entities/match/api';
import { Match } from '@/entities/match/types';
import Layout from '@/shared/ui/Layout/Layout';
import MatchCard from '@/shared/ui/MatchCard/MatchCard';
import '../shared/ui/styles/MainPage.css';

const MainPage = () => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Временные данные для тестирования UI
  const upcomingMatches = [
    { homeTeam: 'Барселона', awayTeam: 'Реал Мадрид', time: '22:00', date: '12.05.2025', tournament: 'Ла Лига' },
    { homeTeam: 'Манчестер Сити', awayTeam: 'Арсенал', time: '19:30', date: '13.05.2025', tournament: 'Премьер-лига' },
    { homeTeam: 'Бавария', awayTeam: 'Боруссия Д', time: '21:00', date: '14.05.2025', tournament: 'Бундеслига' },
    { homeTeam: 'ПСЖ', awayTeam: 'Лион', time: '20:45', date: '15.05.2025', tournament: 'Лига 1' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getLiveMatches();
        setLiveMatches(data.slice(0, 3)); // только первые 3 матча
      } catch (err) {
        console.error('Ошибка получения матчей:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="container">
        {/* Hero секция */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">SportPulse</h1>
            <p className="hero-subtitle">Футбол в прямом эфире. Без рекламы. Без регистрации.</p>
            
            <div className="hero-buttons">
              <Link to="/live" className="btn btn-primary">🔴 Смотреть Live</Link>
              <Link to="/upcoming" className="btn btn-outline">Расписание матчей</Link>
            </div>
          </div>
        </section>

        {/* Секция Live матчей */}
        <section className="matches-section">
          <div className="section-header">
            <h2 className="section-title">Сейчас в эфире</h2>
            <Link to="/live" className="section-link">Смотреть все</Link>
          </div>

          {isLoading ? (
            <div className="loader-container">Загрузка...</div>
          ) : liveMatches.length > 0 ? (
            <div className="matches-grid">
              {liveMatches.map((match, idx) => (
                <MatchCard
                  key={idx}
                  homeTeam={match.home}
                  awayTeam={match.away}
                  status="LIVE"
                  date={match.date}
                />
              ))}
            </div>
          ) : (
            <div className="no-matches">
              <p>Сейчас нет матчей в прямом эфире</p>
            </div>
          )}
        </section>

        {/* Секция предстоящих матчей */}
        <section className="matches-section">
          <div className="section-header">
            <h2 className="section-title">Скоро начнутся</h2>
            <Link to="/upcoming" className="section-link">Календарь</Link>
          </div>

          <div className="matches-row">
            {upcomingMatches.map((match, idx) => (
              <div className="match-card-container" key={idx}>
                <MatchCard
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  status="UPCOMING"
                  time={match.time}
                  date={match.date}
                  tournament={match.tournament}
                />
              </div>
            ))}
          </div>
        </section>
        
        {/* Информация о проекте */}
        <section className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🎮</div>
              <h3>Прямые трансляции</h3>
              <p>Следите за всеми футбольными матчами в реальном времени</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📊</div>
              <h3>Статистика</h3>
              <p>Доступ к актуальной статистике игроков и команд</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔔</div>
              <h3>Уведомления</h3>
              <p>Получайте уведомления о голах и важных событиях</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default MainPage;