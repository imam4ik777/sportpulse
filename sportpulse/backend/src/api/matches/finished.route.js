const express = require('express');
const Match = require('../../entities/match/model');  // Модель для матчей в MongoDB
const redis = require('../../shared/redis/client');  // Клиент Redis

const router = express.Router();

// Маршрут для получения завершенных матчей
router.get('/', async (req, res) => {
  try {
    // Извлечение параметров фильтрации из запроса
    const { tournament, date, period, page = 1, limit = 10 } = req.query;
    
    // Формирование кэш-ключа на основе параметров
    const cacheKey = `matches:finished:${tournament || 'all'}:${date || 'all'}:${period || 'all'}:${page}:${limit}`;
    
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные о завершенных матчах получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Формирование фильтра для запроса к MongoDB
    const filter = { status: 'FINISHED' };
    
    // Добавление дополнительных фильтров
    if (tournament) {
      filter.tournament = tournament;
    }
    
    // Фильтр по конкретной дате
    if (date) {
      const selectedDate = new Date(date);
      filter.date = { 
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)), 
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999)) 
      };
    }
    
    // Фильтр по периоду
    if (period && !date) {
      const now = new Date();
      
      switch (period) {
        case 'today':
          filter.date = { 
            $gte: new Date(now.setHours(0, 0, 0, 0)), 
            $lt: new Date(now.setHours(23, 59, 59, 999)) 
          };
          break;
        case 'yesterday':
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          filter.date = { 
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)), 
            $lt: new Date(yesterday.setHours(23, 59, 59, 999)) 
          };
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filter.date = { $gte: weekAgo, $lt: new Date() };
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filter.date = { $gte: monthAgo, $lt: new Date() };
          break;
      }
    }

    // Запрос к MongoDB с пагинацией
    const matches = await Match.find(filter)
      .sort({ date: -1 })  // Сортировка по дате (новые сначала)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Если данных нет в MongoDB, отправляем пустой массив
    if (!matches || matches.length === 0) {
      console.log('В базе данных нет завершенных матчей');
      return res.json([]);
    }

    // Сохраняем полученные данные в Redis для кэширования (на 10 минут)
    await redis.set(cacheKey, JSON.stringify(matches), 'EX', 600);
    console.log('Данные о завершенных матчах получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(matches);

  } catch (err) {
    console.error('Ошибка при запросе завершенных матчей:', err);
    
    // Отправляем информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных о завершенных матчах',
      error: err.message
    });
  }
});

module.exports = router; 