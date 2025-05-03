const express = require('express');
const cors = require('cors');
const { connectMongo } = require('../shared/config/mongo');
require('../shared/config/env');  // Загружаем переменные окружения

// Маршруты для матчей
const liveRoute = require('../api/matches/live.route');
const upcomingRoute = require('../api/matches/upcoming.route');  
const finishedRoute = require('../api/matches/finished.route');  
const popularMatchesRoute = require('../api/matches/popular.route');  

// Маршруты для команд
const teamsRoute = require('../api/teams/index.route');
const popularTeamsRoute = require('../api/teams/popular.route');

// Прокси для SportMonks API
const sportmonksProxyRoute = require('../api/sportmonks/proxy.route');

// Новый оптимизированный маршрут для live-матчей
const simpleLiveRoute = require('../routes/live');

// CRON функции
const { fetchLiveMatches } = require('../features/live/cron');

const app = express();

// Настраиваем CORS для разрешения запросов от frontend 
app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000'],
  credentials: true
}));

app.use(express.json());  // Разбор JSON данных

// Регистрация маршрутов для матчей
app.use('/api/matches/live', liveRoute);
app.use('/api/matches/upcoming', upcomingRoute);
app.use('/api/matches/finished', finishedRoute);
app.use('/api/matches/popular', popularMatchesRoute);

// Регистрация маршрутов для команд
app.use('/api/teams', teamsRoute);
app.use('/api/teams/popular', popularTeamsRoute);

// Регистрация прокси для SportMonks API
app.use('/api/sportmonks', sportmonksProxyRoute);

// Регистрация нового оптимизированного маршрута для live-матчей
app.use(simpleLiveRoute);

// Простой эндпоинт для проверки работоспособности API
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now()
  });
});

// Подключение к Mongo и запуск сервера
connectMongo().then(() => {
  app.listen(3001, () => {
    console.log('🚀 Backend запущен на http://localhost:3001');
  });
});

// Автоматическое обновление live-матчей каждые 2 минуты
const cron = require('node-cron');
cron.schedule('*/2 * * * *', fetchLiveMatches);  // Каждые 2 минуты