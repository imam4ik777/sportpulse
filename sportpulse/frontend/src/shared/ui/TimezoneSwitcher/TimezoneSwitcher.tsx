import React, { useState, useEffect } from 'react';
import { setUserTimezone } from '@/shared/api/sportmonks';
import './TimezoneSwitcher.css';

// Популярные часовые пояса
const POPULAR_TIMEZONES = [
  { id: 'Europe/Moscow', label: 'Москва (MSK)' },
  { id: 'Europe/London', label: 'Лондон (GMT/BST)' },
  { id: 'Europe/Berlin', label: 'Берлин (CET/CEST)' },
  { id: 'auto', label: 'Автоматически' }
];

const TimezoneSwitcher: React.FC = () => {
  // Получаем сохраненный часовой пояс из localStorage
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    localStorage.getItem('userTimezone') || 'auto'
  );

  // Определяем часовой пояс при монтировании компонента
  useEffect(() => {
    if (!localStorage.getItem('userTimezone')) {
      setUserTimezone('auto');
    }
  }, []);

  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);
    setUserTimezone(timezone);
    
    // Перезагружаем страницу для применения нового часового пояса
    // В реальном приложении лучше использовать более элегантное решение без перезагрузки
    window.location.reload();
  };

  return (
    <div className="timezone-switcher">
      <label className="timezone-label">Часовой пояс:</label>
      <select 
        className="timezone-select"
        value={selectedTimezone}
        onChange={(e) => handleTimezoneChange(e.target.value)}
      >
        {POPULAR_TIMEZONES.map((tz) => (
          <option key={tz.id} value={tz.id}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimezoneSwitcher; 