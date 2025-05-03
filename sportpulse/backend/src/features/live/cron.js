// backend/src/features/live/cron.js
const axios = require('axios');
const { SPORTMONKS_TOKEN } = process.env;  // Исправляем имя переменной в соответствии с docker-compose
const Match = require('../../entities/match/model');
const redis = require('../../shared/redis/client');

const fetchLiveMatches = async () => {
  try {
    // Проверяем наличие ключа API
    if (!SPORTMONKS_TOKEN) {
      console.error('❌ Отсутствует ключ API для SportMonks');
      return;
    }
    
    const response = await axios.get('https://api.sportmonks.com/v2.0/football/livescores/inplay', {
      headers: { 'Authorization': `Bearer ${SPORTMONKS_TOKEN}` },
    });

    // Проверяем структуру данных
    if (!response.data || !response.data.data) {
      console.error('❌ Некорректный формат данных от SportMonks API');
      return;
    }

    const matches = response.data.data.map((match) => ({
      home: match.participants[0]?.name || '',
      away: match.participants[1]?.name || '',
      date: match.time?.starting_at?.date_time || '',
      status: match.time?.status || 'NS',
    }));

    // Обновляем данные в MongoDB
    await Match.deleteMany({ status: 'LIVE' });
    await Match.insertMany(matches);

    // Кэшируем данные в Redis (адаптируем под ioredis)
    await redis.set('matches:live', JSON.stringify(matches), 'EX', 60);

    console.log('✅ Live матчи обновлены');
  } catch (err) {
    console.error('❌ Ошибка при запросе live матчей:', err);
  }
};

module.exports = { fetchLiveMatches };