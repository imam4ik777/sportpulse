import React from 'react';
import './MatchCard.css';

export interface MatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  time?: string;
  date?: string;
  tournament?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  time,
  date,
  tournament
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'LIVE':
        return <span className="match-status live">LIVE</span>;
      case 'UPCOMING':
        return <span className="match-status upcoming">{time}</span>;
      case 'FINISHED':
        return <span className="match-status finished">Завершен</span>;
      default:
        return null;
    }
  };

  const getScoreDisplay = () => {
    if (status === 'UPCOMING') {
      return <span className="match-time">{time || '00:00'}</span>;
    }
    
    return (
      <div className="match-score">
        <span className="score">{homeScore !== undefined ? homeScore : '-'}</span>
        <span className="score-divider">:</span>
        <span className="score">{awayScore !== undefined ? awayScore : '-'}</span>
      </div>
    );
  };

  return (
    <div className={`match-card ${status.toLowerCase()}`}>
      {tournament && <div className="match-tournament">{tournament}</div>}
      <div className="match-status-container">{getStatusDisplay()}</div>
      
      <div className="match-content">
        <div className="match-team home">
          <span className="team-name">{homeTeam}</span>
        </div>
        
        {getScoreDisplay()}
        
        <div className="match-team away">
          <span className="team-name">{awayTeam}</span>
        </div>
      </div>
      
      {date && <div className="match-date">{date}</div>}
    </div>
  );
};

export default MatchCard; 