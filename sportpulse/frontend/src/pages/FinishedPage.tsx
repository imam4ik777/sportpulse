import React from 'react';
import Layout from '@/shared/ui/Layout/Layout';
import '../shared/ui/styles/FinishedPage.css';

const FinishedPage = () => {
  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="finished-icon">⚪</span>
            Завершенные матчи
          </h1>
          <p className="page-description">
            Результаты прошедших футбольных матчей и статистика
          </p>
        </div>
        
        <div className="finished-tabs">
          <button className="tab-btn active">Сегодня</button>
          <button className="tab-btn">Вчера</button>
          <button className="tab-btn">7 дней</button>
          <button className="tab-btn">30 дней</button>
          <button className="tab-btn">Выбрать дату</button>
        </div>
        
        <div className="results-filter">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Поиск по командам или турнирам..."
              className="search-input"
            />
            <button className="search-btn">
              🔍
            </button>
          </div>
          
          <div className="filter-dropdown">
            <button className="dropdown-btn">
              Турниры ▾
            </button>
            {/* Dropdown content would go here */}
          </div>
        </div>
        
        <div className="finished-placeholder">
          <div className="placeholder-icon">🏆</div>
          <h3>Скоро здесь появятся результаты матчей</h3>
          <p>Мы работаем над получением самых актуальных данных о завершенных матчах</p>
        </div>
        
        <div className="pagination">
          <button className="page-btn disabled">◀</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <span className="page-divider">...</span>
          <button className="page-btn">10</button>
          <button className="page-btn">▶</button>
        </div>
      </div>
    </Layout>
  );
};

export default FinishedPage;