const express = require('express');
const Match = require('../../entities/match/model');  // Модель для матчей в MongoDB
const redis = require('../../shared/redis/client');  // Клиент Redis

const router = express.Router();

// Маршрут для получения популярных матчей (для главной страницы)
router.get('/', async (req, res) => {
  try {
    // Извлечение параметров из запроса
    const { limit = 5 } = req.query;
    
    // Формирование кэш-ключа на основе параметров
    const cacheKey = `matches:popular:${limit}`;
    
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные о популярных матчах получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Получаем 3 категории матчей
    const pipeline = [
      // Стадия 1: Сегодняшние live-матчи
      {
        $match: {
          status: 'LIVE',
          date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      },
      { $limit: Math.ceil(parseInt(limit) / 3) },
      
      // Стадия 2: Ближайшие предстоящие матчи
      {
        $unionWith: {
          coll: 'matches',
          pipeline: [
            {
              $match: {
                status: 'UPCOMING',
                date: { $gte: new Date() }
              }
            },
            { $sort: { date: 1 } },
            { $limit: Math.ceil(parseInt(limit) / 3) }
          ]
        }
      },
      
      // Стадия 3: Недавно завершённые матчи
      {
        $unionWith: {
          coll: 'matches',
          pipeline: [
            {
              $match: {
                status: 'FINISHED',
                date: { $lt: new Date() }
              }
            },
            { $sort: { date: -1 } },
            { $limit: Math.ceil(parseInt(limit) / 3) }
          ]
        }
      },
      
      // Финальная сортировка
      {
        $sort: {
          // Сначала LIVE, потом UPCOMING, затем FINISHED
          status: 1,
          // Для UPCOMING сортировка по возрастанию даты, для остальных - по убыванию
          date: 1
        }
      },
      
      // Ограничение общего результата
      { $limit: parseInt(limit) }
    ];

    const matches = await Match.aggregate(pipeline);

    // Если данных нет, отправляем пустой массив
    if (!matches || matches.length === 0) {
      console.log('В базе данных нет популярных матчей');
      return res.json([]);
    }

    // Сохраняем полученные данные в Redis для кэширования (на 3 минуты)
    await redis.set(cacheKey, JSON.stringify(matches), 'EX', 180);
    console.log('Данные о популярных матчах получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(matches);

  } catch (err) {
    console.error('Ошибка при запросе популярных матчей:', err);
    
    // Отправляем информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных о популярных матчах',
      error: err.message
    });
  }
});

module.exports = router; 