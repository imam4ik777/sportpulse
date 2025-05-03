import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // Путь для API через proxy
});

// Общий метод кэширования для любых типов данных
export const fetchWithCache = async <T>(
  endpoint: string, 
  cacheKey: string, 
  cacheDurationMs: number = 5 * 60 * 1000 // По умолчанию 5 минут
): Promise<T> => {
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(`${cacheKey}Timestamp`);
  const currentTime = Date.now();

  // Проверяем срок хранения данных
  if (cachedData && cachedTime && currentTime - parseInt(cachedTime) < cacheDurationMs) {
    // Если данные есть в localStorage и они свежие
    console.log(`Загружены данные из localStorage: ${cacheKey}`);
    return JSON.parse(cachedData) as T;
  }

  // Если данных нет или они устарели — делаем запрос к API
  try {
    const response = await api.get<T>(endpoint);
    
    // Если API возвращает пустые данные, возвращаем кэшированные или пустой массив/объект
    if (!response.data) {
      console.warn(`API вернуло пустые данные для ${endpoint}`);
      return cachedData ? JSON.parse(cachedData) as T : ([] as unknown as T);
    }

    // Сохраняем полученные данные в localStorage
    localStorage.setItem(cacheKey, JSON.stringify(response.data));
    localStorage.setItem(`${cacheKey}Timestamp`, currentTime.toString());
    console.log(`Данные получены с API и сохранены в localStorage: ${cacheKey}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при запросе ${endpoint}:`, error);
    // Если ошибка, возвращаем кэшированные данные или пустой массив/объект
    return cachedData ? JSON.parse(cachedData) as T : ([] as unknown as T);
  }
};

export default api;