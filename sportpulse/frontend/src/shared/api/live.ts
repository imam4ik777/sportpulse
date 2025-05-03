/**
 * Оптимизированная функция для получения live-матчей
 * Использует специальный эндпоинт на бэкенде, который упрощает получение данных
 * Включает защиту от таймаутов и повторные попытки запросов
 */
import { fetchSafe, safeRequest } from '../lib/api/safeRequest';

/**
 * Получить live-матчи с автоматической обработкой ошибок и таймаутами
 * @returns Данные о live-матчах или ошибка
 */
export const getLiveMatches = async () => {
  try {
    // Определяем часовой пояс пользователя
    const savedTimezone = localStorage.getItem('userTimezone');
    let timezone;
    
    if (savedTimezone === 'auto' || !savedTimezone) {
      // Автоматическое определение часового пояса
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(`Используем автоопределенный часовой пояс: ${timezone}`);
    } else {
      // Используем выбранный пользователем часовой пояс
      timezone = savedTimezone;
      console.log(`Используем выбранный пользователем часовой пояс: ${timezone}`);
    }

    // Формируем URL с параметром часового пояса
    const url = `/api/live?timezone=${encodeURIComponent(timezone)}`;
    console.log(`Запрос к оптимизированному API: ${url}`);
    
    // Используем нашу безопасную функцию запросов с увеличенным таймаутом
    const result = await safeRequest(url, {
      timeout: 25000, // 25 секунд таймаут (увеличен)
      retries: 2,     // 2 повторные попытки
      retryDelay: 3000, // 3 секунды между попытками (увеличено)
      verbose: true,  // Включаем подробное логирование
      // Отключаем кеширование для live-данных
      cache: 'no-store'
    });
    
    if (!result.success) {
      throw result.error;
    }
    
    console.log(`✅ Получены данные через ${result.time}мс: ${result.data?.data?.length || 0} live-матчей`);
    return result.data;
  } catch (error: unknown) {
    console.error('❌ Ошибка при запросе live-матчей:', error);
    throw error;
  }
};

/**
 * Версия функции с автоматическими повторными попытками
 * Пытается запросить данные несколько раз, если сервер временно недоступен
 */
export const getLiveMatchesWithRetry = async (maxRetries = 3, retryDelay = 3000) => {
  // Добавляем диагностическое сообщение при начале запроса
  console.log(`🔄 Начинаем запрос live-матчей с ${maxRetries} повторами и задержкой ${retryDelay}мс`);
  
  // Проверяем соединение
  if (!navigator.onLine) {
    console.error('❌ Отсутствует подключение к интернету');
    throw new Error('Нет подключения к интернету');
  }
  
  try {
    // Делаем предварительную проверку API
    console.log('📡 Проверка доступности API...');
    
    try {
      const preflightCheck = await fetch('/api/live?check=true', { 
        method: 'HEAD',
        cache: 'no-store'
      });
      console.log(`✅ Предварительная проверка API: ${preflightCheck.status} ${preflightCheck.statusText}`);
    } catch (preflightError) {
      console.warn('⚠️ Предварительная проверка API не удалась:', preflightError);
    }
    
    // Используем саму fetchSafe функцию, которая уже поддерживает повторы
    const apiUrl = `/api/live?timezone=${encodeURIComponent(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    )}&_t=${Date.now()}`; // Добавляем timestamp для предотвращения кеширования
    
    console.log(`📡 Запрос к API: ${apiUrl}`);
    
    return await fetchSafe(
      apiUrl,
      {
        timeout: 25000,  // 25 секунд (увеличено)
        retries: maxRetries,
        retryDelay: retryDelay,
        cache: 'no-store',
        verbose: true // Включаем детальное логирование
      }
    );
  } catch (error: unknown) {
    console.error(`❌ Не удалось получить данные после ${maxRetries+1} попыток:`, error);
    
    // Добавляем дополнительную диагностическую информацию
    if (error instanceof Error) {
      console.error(`📊 Детали ошибки: ${error.message}`);
      console.error(`📝 Стек вызовов: ${error.stack}`);
      
      // Проверяем тип ошибки
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        console.error('🌐 Ошибка сети - проверьте подключение к интернету');
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        console.error('⏱️ Таймаут запроса - проверьте скорость соединения или доступность сервера');
      } else if (error.message.includes('504')) {
        console.error('⚠️ Gateway Timeout (504) - API/прокси не отвечает вовремя');
        // Установим задержку и сделаем еще одну попытку
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await fetchSafe(
          `/api/live?timezone=${encodeURIComponent(
            Intl.DateTimeFormat().resolvedOptions().timeZone
          )}&retry=final&_t=${Date.now()}`, 
          {
            timeout: 30000, // Увеличиваем таймаут
            retries: 0,     // Без повторов - последняя попытка
            cache: 'no-store',
            headers: {
              'X-Final-Attempt': 'true'
            }
          }
        );
      }
    }
    
    throw error;
  }
}; 