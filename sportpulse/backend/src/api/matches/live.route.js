const express = require('express');
const Match = require('../../entities/match/model');  // Модель для матчей в MongoDB
const redis = require('../../shared/redis/client');  // Клиент Redis

const router = express.Router();

// Маршрут для получения live-матчей
router.get('/', async (req, res) => {
  try {
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get('matches:live');
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Если данных нет в кэше — запрашиваем их из MongoDB
    const matches = await Match.find({ status: 'LIVE' });

    // Если данных нет в MongoDB, отправляем пустой массив (не 404)
    if (!matches || matches.length === 0) {
      console.log('В базе данных нет live матчей');
      return res.json([]);
    }

    // Сохраняем полученные данные в Redis для ускорения будущих запросов (кэшируем на 1 минуту)
    await redis.set('matches:live', JSON.stringify(matches), 'EX', 60);
    console.log('Данные получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(matches);

  } catch (err) {
    console.error('Ошибка при запросе live матчей:', err);
    
    // Отправляем более информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных',
      error: err.message
    });
  }
});

module.exports = router;