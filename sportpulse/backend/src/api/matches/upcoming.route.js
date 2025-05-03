const express = require('express');
const Match = require('../../entities/match/model');  // Модель для матчей в MongoDB
const redis = require('../../shared/redis/client');  // Клиент Redis

const router = express.Router();

// Маршрут для получения предстоящих матчей
router.get('/', async (req, res) => {
  try {
    // Извлечение параметров фильтрации из запроса
    const { tournament, period, page = 1, limit = 10 } = req.query;
    
    // Формирование кэш-ключа на основе параметров
    const cacheKey = `matches:upcoming:${tournament || 'all'}:${period || 'all'}:${page}:${limit}`;
    
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные о предстоящих матчах получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Формирование фильтра для запроса к MongoDB
    const filter = { status: 'UPCOMING' };
    
    // Добавление дополнительных фильтров
    if (tournament) {
      filter.tournament = tournament;
    }
    
    // Фильтр по периоду
    if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          filter.date = { $gte: new Date(now.setHours(0, 0, 0, 0)), $lt: new Date(now.setHours(23, 59, 59, 999)) };
          break;
        case 'tomorrow':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          filter.date = { $gte: new Date(tomorrow.setHours(0, 0, 0, 0)), $lt: new Date(tomorrow.setHours(23, 59, 59, 999)) };
          break;
        case 'week':
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          filter.date = { $gte: new Date(), $lt: nextWeek };
          break;
        case 'month':
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          filter.date = { $gte: new Date(), $lt: nextMonth };
          break;
      }
    }

    // Запрос к MongoDB с пагинацией
    const matches = await Match.find(filter)
      .sort({ date: 1 })  // Сортировка по дате (ближайшие сначала)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Если данных нет в MongoDB, отправляем пустой массив
    if (!matches || matches.length === 0) {
      console.log('В базе данных нет предстоящих матчей');
      return res.json([]);
    }

    // Сохраняем полученные данные в Redis для кэширования (на 5 минут)
    await redis.set(cacheKey, JSON.stringify(matches), 'EX', 300);
    console.log('Данные о предстоящих матчах получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(matches);

  } catch (err) {
    console.error('Ошибка при запросе предстоящих матчей:', err);
    
    // Отправляем информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных о предстоящих матчах',
      error: err.message
    });
  }
});

module.exports = router; 