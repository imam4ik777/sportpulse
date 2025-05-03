const express = require('express');
const axios = require('axios');
const { SPORTMONKS_TOKEN } = process.env; 

const router = express.Router();

// Простой кеш в памяти для хранения последних успешных ответов
const apiCache = {
  livescores: {
    data: null,
    timestamp: 0,
    validityPeriod: 5 * 60 * 1000 // 5 минут
  }
};

// Создаем экземпляр axios с таймаутом и повторами
const sportmonksClient = axios.create({
  timeout: 30000, // 30 секунд таймаут (увеличен с 20)
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'SportPulse-Server/1.0'
  }
});

/**
 * Функция для безопасного выполнения запроса к SportMonks API с таймаутом
 * @param {string} url - URL для запроса
 * @param {Object} options - Опции запроса 
 * @returns {Promise} - Результат запроса
 */
const safeSportmonksRequest = async (url, options = {}) => {
  // Создаем контроллер для возможности прервать запрос
  const controller = new AbortController();
  // Устанавливаем таймаут на 30 секунд
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await sportmonksClient.get(url, {
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

// Прокси для запросов к SportMonks API
router.get('/:endpoint(*)', async (req, res) => {
  // Извлекаем параметры запроса
  const { endpoint } = req.params;
  const timezone = req.query.timezone || 'Europe/Moscow';
  const include = req.query.include || '';
  
  // Проверяем и корректируем параметр include
  if (include && include.includes(',')) {
    console.warn('⚠️ Параметр include содержит запятые, заменяем на точку с запятой');
    req.query.include = include.replace(/,/g, ';');
  }
  
  // Формируем URL для запроса к SportMonks API
  const apiUrl = `https://api.sportmonks.com/v3/football/${endpoint}`;
  
  // Строим параметры запроса
  const params = new URLSearchParams({
    api_token: SPORTMONKS_TOKEN,
    timezone: timezone,
    ...req.query
  });
  
  // Добавляем timestamp для предотвращения кеширования
  params.append('_t', Date.now().toString());
  
  const startTime = Date.now();
  
  try {
    console.log(`➡️ Запрос к SportMonks API: ${apiUrl} (часовой пояс: ${timezone})`);
    
    // Используем нашу безопасную функцию с таймаутом
    const response = await safeSportmonksRequest(`${apiUrl}?${params.toString()}`);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Получен ответ от SportMonks API за ${responseTime}мс: ${endpoint} с ${response.data?.data?.length || 0} элементами`);
    
    // Кешируем данные для livescores
    if (endpoint === 'livescores') {
      apiCache.livescores = {
        data: response.data,
        timestamp: Date.now(),
        validityPeriod: 5 * 60 * 1000
      };
    }
    
    // Возвращаем данные клиенту
    return res.json(response.data);
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ Ошибка запроса к SportMonks API (${errorTime}мс):`, error.message);
    
    // Проверяем наличие кеша для livescores
    if (endpoint === 'livescores' && apiCache.livescores.data) {
      const cacheAge = Date.now() - apiCache.livescores.timestamp;
      if (cacheAge < apiCache.livescores.validityPeriod) {
        console.log(`⚠️ Используем кешированные данные для livescores (возраст: ${Math.round(cacheAge/1000)}с)`);
        
        // Добавляем заголовок для отслеживания источника данных
        res.set('X-Data-Source', 'proxy-cache');
        res.set('X-Cache-Age', `${Math.round(cacheAge/1000)}s`);
        
        return res.json(apiCache.livescores.data);
      }
    }
    
    // Возвращаем информативную ошибку с указанием времени
    return res.status(503).json({
      error: true,
      message: error.message,
      details: `Запрос ${endpoint} прерван после ${errorTime}мс`,
      suggestion: 'Пожалуйста, повторите попытку позже'
    });
  }
});

// Эндпоинт для получения live-матчей
router.get('/live', async (req, res) => {
  try {
    // Перенаправляем запрос через наш прокси
    const timezone = req.query.timezone || 'Europe/Moscow';
    const include = req.query.include || 'participants;league;venue;scores';
    
    // Формируем URL для запроса - убедимся, что используем правильный эндпоинт livescores
    const params = new URLSearchParams({
      api_token: SPORTMONKS_TOKEN,
      timezone: timezone,
      include: include
    });
    
    // Выполняем запрос с таймаутом (правильный эндпоинт - livescores/inplay)
    const apiUrl = 'https://api.sportmonks.com/v3/football/livescores/inplay';
    console.log(`➡️ Запрос к SportMonks API (live): ${apiUrl} (часовой пояс: ${timezone})`);
    
    const startTime = Date.now();
    const response = await safeSportmonksRequest(`${apiUrl}?${params.toString()}`);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Получен ответ от SportMonks API (live) за ${responseTime}мс: найдено ${response.data?.data?.length || 0} матчей`);
    
    // Кешируем успешные данные
    apiCache.livescores = {
      data: response.data,
      timestamp: Date.now(),
      validityPeriod: 5 * 60 * 1000 // 5 минут
    };
    
    // Возвращаем данные
    return res.json(response.data);
  } catch (error) {
    console.error('❌ Ошибка запроса live-матчей:', error.message);
    return res.status(503).json({
      error: true,
      message: 'Ошибка получения live-матчей',
      details: error.message,
      suggestion: 'Попробуйте повторить запрос позже или проверить статус API на sportmonks.com'
    });
  }
});

module.exports = router;