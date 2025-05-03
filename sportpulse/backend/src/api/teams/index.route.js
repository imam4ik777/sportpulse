const express = require('express');
const Team = require('../../entities/team/model');  // Модель для команд в MongoDB
const redis = require('../../shared/redis/client');  // Клиент Redis

const router = express.Router();

// Маршрут для получения списка команд с фильтрацией
router.get('/', async (req, res) => {
  try {
    // Извлечение параметров фильтрации из запроса
    const { name, league, country, letter, page = 1, limit = 10 } = req.query;
    
    // Формирование кэш-ключа на основе параметров
    const cacheKey = `teams:${name || 'all'}:${league || 'all'}:${country || 'all'}:${letter || 'all'}:${page}:${limit}`;
    
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные о командах получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Формирование фильтра для запроса к MongoDB
    const filter = {};
    
    // Добавление фильтров
    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // Case-insensitive поиск
    }
    
    if (league) {
      filter.league = league;
    }
    
    if (country) {
      filter.country = country;
    }
    
    if (letter) {
      filter.name = { $regex: `^${letter}`, $options: 'i' }; // Начинается с буквы
    }

    // Запрос к MongoDB с пагинацией
    const teams = await Team.find(filter)
      .sort({ name: 1 }) // Сортировка по имени
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Если данных нет в MongoDB, отправляем пустой массив
    if (!teams || teams.length === 0) {
      console.log('В базе данных нет команд');
      return res.json([]);
    }

    // Сохраняем полученные данные в Redis для кэширования (на 30 минут)
    await redis.set(cacheKey, JSON.stringify(teams), 'EX', 1800);
    console.log('Данные о командах получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(teams);

  } catch (err) {
    console.error('Ошибка при запросе команд:', err);
    
    // Отправляем информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных о командах',
      error: err.message
    });
  }
});

// Маршрут для получения детальной информации о команде
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Формирование кэш-ключа на основе ID
    const cacheKey = `team:${id}`;
    
    // Попытка получить кэшированные данные из Redis
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Если данные есть в кэше, возвращаем их
      console.log('Данные о команде получены из Redis');
      return res.json(JSON.parse(cached));
    }

    // Запрос к MongoDB
    const team = await Team.findById(id);

    // Если команда не найдена, отправляем 404
    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    // Сохраняем полученные данные в Redis для кэширования (на 1 час)
    await redis.set(cacheKey, JSON.stringify(team), 'EX', 3600);
    console.log('Данные о команде получены из MongoDB и сохранены в Redis');

    // Отправляем результат клиенту
    return res.json(team);

  } catch (err) {
    console.error('Ошибка при запросе информации о команде:', err);
    
    // Отправляем информативный ответ об ошибке
    return res.status(500).json({
      message: 'Ошибка при получении данных о команде',
      error: err.message
    });
  }
});

module.exports = router; 