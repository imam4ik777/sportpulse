const express = require('express');
const axios = require('axios');
const { SPORTMONKS_TOKEN } = process.env;

const router = express.Router();

// Простой кеш в памяти для хранения последних успешных данных
let liveMatchesCache = {
  data: null,
  timestamp: 0,
  validityPeriod: 10 * 60 * 1000 // 10 минут в миллисекундах
};

// Создаем экземпляр axios с таймаутом
const axiosInstance = axios.create({
  timeout: 30000, // 30 секунд таймаут (увеличен с 20 до 30)
});

/**
 * Функция для безопасного выполнения запроса к SportMonks API с таймаутом
 * @param {string} url - URL для запроса
 * @param {Object} options - Опции запроса 
 * @returns {Promise} - Результат запроса
 */
const safeRequest = async (url, options = {}) => {
  // Создаем контроллер для возможности прервать запрос
  const controller = new AbortController();
  // Устанавливаем таймаут на 30 секунд
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await axiosInstance.get(url, {
      ...options,
      signal: controller.signal,
    });
    
    return response;
  } catch (error) {
    // Обрабатываем ошибки с подробной информацией
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('Превышено время ожидания ответа от SportMonks API');
    } else if (error.response) {
      // Ошибка ответа сервера (статус не 2xx)
      if (error.response.status === 504) {
        console.error('Получена ошибка 504 Gateway Timeout от SportMonks API');
        throw new Error('Сервер SportMonks не ответил вовремя (504 Gateway Timeout)');
      }
      throw new Error(`Ошибка SportMonks API: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      // Запрос отправлен, но ответ не получен
      throw new Error('Запрос отправлен, но ответ от SportMonks API не получен');
    } else {
      // Ошибка при настройке запроса
      throw new Error(`Ошибка запроса к SportMonks API: ${error.message}`);
    }
  } finally {
    // Очищаем таймаут в любом случае
    clearTimeout(timeoutId);
  }
};

// 🟢 GET /api/live — вернуть live-матчи с авто-таймзоной (или fallback)
router.get('/api/live', async (req, res) => {
  const { timezone, check, _debug } = req.query;

  // Если это проверочный запрос, просто возвращаем 200 OK
  if (check === 'true') {
    console.log('Получен проверочный запрос к /api/live');
    return res.status(200).send('OK');
  }

  // Режим отладки
  const debug = _debug === 'true';
  if (debug) {
    console.log('Запущен в режиме отладки:', { 
      query: req.query,
      headers: req.headers
    });
  }

  // fallback на Europe/Moscow
  const tz = typeof timezone === 'string' && timezone.length > 0
    ? timezone
    : 'Europe/Moscow';

  const apiUrl = `https://api.sportmonks.com/v3/football/livescores/inplay`;
  
  // Формируем параметры запроса
  const params = new URLSearchParams({
    api_token: SPORTMONKS_TOKEN,
    timezone: tz,
    include: 'participants;league;venue;scores'
  });

  // Добавляем timestamp для предотвращения кеширования
  params.append('_t', Date.now().toString());

  const startTime = Date.now();
  
  try {
    console.log(`➡️ Запрос к SportMonks API (livescores): ${apiUrl} (часовой пояс: ${tz})`);
    
    // Используем нашу безопасную функцию с таймаутом
    const response = await safeRequest(`${apiUrl}?${params.toString()}`);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Получен ответ от SportMonks API за ${responseTime}мс: найдено ${response.data?.data?.length || 0} live-матчей`);
    
    // Если данные пусты, но статус успешный - просто вернуть пустой массив
    if (!response.data?.data) {
      console.log('⚠️ SportMonks API вернул успешный ответ, но без данных');
      return res.json({ data: [] });
    }
    
    // Кешируем успешные данные
    liveMatchesCache = {
      data: response.data,
      timestamp: Date.now(),
      validityPeriod: 10 * 60 * 1000 // 10 минут
    };
    
    // Добавляем заголовки для диагностики
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-Data-Source', 'api');
    res.set('X-Matches-Count', response.data?.data?.length || 0);
    
    res.json(response.data);
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ Ошибка запроса к SportMonks (${errorTime}мс):`, err.message);
    
    // Проверяем наличие и актуальность кеша
    const cacheAge = Date.now() - liveMatchesCache.timestamp;
    if (liveMatchesCache.data && cacheAge < liveMatchesCache.validityPeriod) {
      console.log(`⚠️ Используем кешированные данные (возраст: ${Math.round(cacheAge/1000)}с)`);
      // Добавляем заголовки для диагностики
      res.set('X-Data-Source', 'cache');
      res.set('X-Cache-Age', `${Math.round(cacheAge/1000)}s`);
      res.set('X-Error', err.message.substring(0, 100));
      res.set('X-Error-Time', `${errorTime}ms`);
      
      return res.json(liveMatchesCache.data);
    }
    
    // Проверяем тип ошибки для более подробной диагностики
    let errorStatus = 503;
    let errorDetails = {
      error: 'Временная недоступность API SportMonks',
      message: err.message,
      details: `Запрос прерван после ${errorTime}мс`,
      suggestion: 'Пожалуйста, повторите попытку позже или проверьте работоспособность sportmonks.com'
    };
    
    // Если это ошибка Gateway Timeout, добавляем специфичные указания
    if (err.message.includes('504') || err.message.includes('Gateway Timeout')) {
      errorDetails.suggestion = 'Сервер SportMonks не ответил вовремя. Попробуйте повторить запрос позже.';
      errorDetails.errorType = 'gateway_timeout';
    }
    
    // Возвращаем осмысленную ошибку
    res.status(errorStatus).json(errorDetails);
  }
});

module.exports = router; 