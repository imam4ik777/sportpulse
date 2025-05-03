// backend/src/shared/redis/client.js
const Redis = require('ioredis');

// Создаем подключение к Redis, используя переменную окружения или значение по умолчанию
const client = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

client.on('connect', () => {
  console.log('✅ Подключение к Redis успешно');
});

client.on('error', (err) => {
  console.error('❌ Ошибка Redis:', err);
});

module.exports = client;