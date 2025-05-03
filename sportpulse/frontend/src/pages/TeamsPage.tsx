import React from 'react';
import Layout from '@/shared/ui/Layout/Layout';
import '../shared/ui/styles/TeamsPage.css';

const TeamsPage = () => {
  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="teams-icon">👥</span>
            Команды
          </h1>
          <p className="page-description">
            Просмотр информации о футбольных командах и статистике игроков
          </p>
        </div>
        
        <div className="teams-search-section">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Поиск команды..." 
              className="teams-search-input"
            />
            <button className="teams-search-btn">
              Найти
            </button>
          </div>
          
          <div className="popular-tags">
            <span className="tag-label">Популярные:</span>
            <div className="tags-list">
              <button className="team-tag">Премьер-лига</button>
              <button className="team-tag">Лига Чемпионов</button>
              <button className="team-tag">Ла Лига</button>
              <button className="team-tag">Серия А</button>
              <button className="team-tag">Бундеслига</button>
            </div>
          </div>
        </div>
        
        <div className="teams-alphabet">
          <span className="alphabet-label">Фильтр по алфавиту:</span>
          <div className="alphabet-buttons">
            <button className="alphabet-btn active">Все</button>
            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
              <button key={letter} className="alphabet-btn">
                {letter}
              </button>
            ))}
          </div>
        </div>
        
        <div className="teams-placeholder">
          <div className="placeholder-icon">⚽</div>
          <h3>Скоро здесь появятся команды</h3>
          <p>Мы работаем над получением самых актуальных данных о командах и игроках</p>
        </div>
      </div>
    </Layout>
  );
};

export default TeamsPage; 