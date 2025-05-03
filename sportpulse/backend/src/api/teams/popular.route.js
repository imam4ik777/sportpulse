const express = require('express');
const Team = require('../../entities/team/model');  // Модель для команд в MongoDB
const redis = require('../../shared/redis/client');  // Клиент Redis

const router = express.Router();

// Маршрут для получения популярных команд
router.get('/', async (req, res) => {
  try {
    // Извлечение параметров из запроса
    const { limit = 5 } = req.query;
    
    // Формирование кэш-ключа на основе параметров
    const cacheKey = `teams:popular:${limit}`;
    
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные о популярных командах получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Запрос к MongoDB за популярными командами (рейтинг, популярные лиги и т.д.)
    // Здесь может быть более сложная логика для определения популярных команд
    const teams = await Team.find()
      .sort({ rating: -1 }) // Предполагаем, что есть поле rating
      .limit(parseInt(limit));

    // Если данных нет в MongoDB, отправляем пустой массив
    if (!teams || teams.length === 0) {
      console.log('В базе данных нет популярных команд');
      return res.json([]);
    }

    // Сохраняем полученные данные в Redis для кэширования (на 1 час)
    await redis.set(cacheKey, JSON.stringify(teams), 'EX', 3600);
    console.log('Данные о популярных командах получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(teams);

  } catch (err) {
    console.error('Ошибка при запросе популярных команд:', err);
    
    // Отправляем информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных о популярных командах',
      error: err.message
    });
  }
});

module.exports = router; 