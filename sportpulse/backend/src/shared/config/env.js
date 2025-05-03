// backend/src/shared/config/env.js
const dotenv = require('dotenv');
dotenv.config();  // Загружаем переменные окружения из .env файла

// Теперь переменные окружения доступны через process.env
const { SPORTMONKS_TOKEN, MONGO_URI, REDIS_URL } = process.env;

if (!SPORTMONKS_TOKEN) {
  console.error('❌ Отсутствует ключ API для SportMonks');
  process.exit(1);  // Прекращаем выполнение, если ключ не найден
}

module.exports = { SPORTMONKS_TOKEN, MONGO_URI, REDIS_URL };