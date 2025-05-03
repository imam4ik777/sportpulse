/**
 * Функция для безопасного выполнения запросов с таймаутом
 * @description Выполняет fetch-запрос с автоматическим таймаутом и обработкой ошибок
 */

/**
 * Интерфейс параметров для безопасного запроса
 */
interface SafeRequestOptions extends RequestInit {
  /** Таймаут в миллисекундах, после которого запрос будет отменен (по умолчанию 15 секунд) */
  timeout?: number;
  /** Количество повторных попыток запроса в случае сетевых ошибок (по умолчанию 0) */
  retries?: number;
  /** Задержка между повторными попытками в миллисекундах (по умолчанию 2 секунды) */
  retryDelay?: number;
  /** Логировать ли подробную информацию в консоль (по умолчанию false) */
  verbose?: boolean;
}

/**
 * Интерфейс результата безопасного запроса
 */
interface SafeRequestResult<T> {
  /** Успешно ли выполнен запрос */
  success: boolean;
  /** Данные ответа */
  data?: T;
  /** Объект ошибки в случае неудачи */
  error?: Error;
  /** HTTP статус ответа (если удалось его получить) */
  status?: number;
  /** Время выполнения запроса в миллисекундах */
  time: number;
}

/**
 * Безопасный запрос с таймаутом и обработкой ошибок
 * @param url URL для запроса
 * @param options Параметры запроса и дополнительные опции
 * @returns Результат запроса с данными или ошибкой
 */
export async function safeRequest<T = any>(
  url: string, 
  options: SafeRequestOptions = {}
): Promise<SafeRequestResult<T>> {
  const {
    timeout = 15000,
    retries = 0,
    retryDelay = 2000,
    verbose = false,
    ...fetchOptions
  } = options;
  
  const startTime = Date.now();
  let currentRetry = 0;
  let lastError: Error | null = null;
  
  // Функция логирования с учетом verbose
  const log = (message: string, ...args: any[]) => {
    if (verbose) {
      console.log(`[safeRequest] ${message}`, ...args);
    }
  };
  
  // Логируем начало запроса
  log(`Запрос к ${url} (таймаут: ${timeout}мс, повторы: ${retries})`);
  
  while (currentRetry <= retries) {
    // Если это повторная попытка, логируем и ждем
    if (currentRetry > 0) {
      log(`Повторная попытка ${currentRetry}/${retries} через ${retryDelay}мс...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    // Создаем AbortController для возможности отмены запроса
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Выполняем запрос с таймаутом
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      // Очищаем таймаут, так как запрос завершился
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        // Если HTTP-статус не в диапазоне 200-299, пробуем получить подробности ошибки
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `HTTP ошибка: ${response.status} ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ошибка: ${response.status} ${response.statusText}`;
        }
        
        // Создаем ошибку с HTTP-статусом и сообщением
        const httpError = new Error(errorMessage);
        Object.assign(httpError, { status: response.status });
        
        throw httpError;
      }
      
      // Для успешного запроса получаем данные
      const data: T = await response.json();
      
      // Возвращаем успешный результат
      log(`Запрос успешно выполнен за ${responseTime}мс`);
      return {
        success: true,
        data,
        status: response.status,
        time: responseTime,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const errorTime = Date.now() - startTime;
      
      // Определяем, стоит ли повторить запрос
      const isNetworkError = 
        (error instanceof Error && error.name === 'AbortError') || 
        (error instanceof Error && 'code' in error && error.code === 'ECONNABORTED') ||
        (error instanceof Error && error.message?.includes('Failed to fetch')) ||
        (error instanceof Error && error.message?.includes('Network request failed'));
        
      // Если это последняя попытка или не сетевая ошибка - прекращаем попытки
      if (currentRetry === retries || !isNetworkError) {
        break;
      }
      
      // Иначе увеличиваем счетчик попыток
      currentRetry++;
    }
  }
  
  // Если мы здесь, значит все попытки не удались
  const errorTime = Date.now() - startTime;
  const errorObj = lastError || new Error('Неизвестная ошибка запроса');
  
  log(`Запрос не удался после ${currentRetry} попыток за ${errorTime}мс: ${errorObj.message}`);
  
  return {
    success: false,
    error: errorObj,
    time: errorTime,
  };
}

/**
 * Функция для запроса с автоматической распаковкой данных и обработкой ошибок
 * @param url URL для запроса
 * @param options Параметры запроса
 * @returns Данные или выбрасывает исключение
 */
export async function fetchSafe<T = any>(
  url: string, 
  options: SafeRequestOptions = {}
): Promise<T> {
  const result = await safeRequest<T>(url, options);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data as T;
}

export default safeRequest; 