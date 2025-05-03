const API_TOKEN = 'SGOwv7vqpd5vWfjM1KVH8vnICMSNBivrBmlMJA7xFq51TTN5ttYqcD82XZns';
const BASE_URL = 'https://api.sportmonks.com/v3/football';

// Функция для получения часового пояса пользователя
const getUserTimezone = (): string => {
  try {
    // Используем Intl API для получения часового пояса пользователя
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error: unknown) {
    // Fallback на московское время, если определение не удалось
    console.warn('Не удалось определить часовой пояс пользователя, используем Москву по умолчанию');
    return 'Europe/Moscow';
  }
};

// Получение сохраненного или определение текущего часового пояса
const getTimezone = (): string => {
  const savedTimezone = localStorage.getItem('userTimezone');
  const resultTimezone = (savedTimezone === 'auto' || !savedTimezone) 
    ? getUserTimezone() 
    : (savedTimezone || 'Europe/Moscow');
  
  console.log(`Выбранный часовой пояс: ${resultTimezone} (настройка: ${savedTimezone || 'не установлена'})`);
  return resultTimezone;
};

// Получение текущего года
const getCurrentYear = (): string => {
  return new Date().getFullYear().toString();
};

// Функция для получения даты в формате YYYY-MM-DD с текущим годом
const formatDate = (date: Date): string => {
  const year = getCurrentYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Базовая функция для запросов к SportMonks API с часовым поясом пользователя
const fetchWithTimezone = async (endpoint: string, params: Record<string, string> = {}) => {
  // Определяем текущий часовой пояс пользователя
  const timezone = getTimezone();
  
  // Проверяем использование параметра include (должен быть с разделителем ';')
  if (params.include && params.include.includes(',')) {
    console.warn('⚠️ Внимание: в параметре include используются запятые. SportMonks API требует разделитель ";"');
    params.include = params.include.replace(/,/g, ';');
  }
  
  try {
    // Используем наш backend-прокси вместо прямых запросов к SportMonks API
    console.log(`Запрос к API через бэкенд-прокси: ${endpoint} (часовой пояс: ${timezone})`);
    
    // Формируем URL с параметрами для запроса через прокси
    const queryParams = new URLSearchParams({
      timezone,
      ...params
    });
    
    // Отправляем запрос через наш бэкенд-прокси
    const url = `/api/sportmonks/${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`❌ Ошибка при запросе к API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Получен ответ от API через прокси: ${endpoint} с ${data.data?.length || 0} элементами`);
    return data;
  } catch (error: unknown) {
    console.error('Ошибка при запросе через прокси:', error);
    // В случае ошибки просто пробрасываем её дальше
    throw error;
  }
};

// Получение матчей по дате
export const fetchFixturesByDate = async (date?: string) => {
  // Если дата не указана, используем текущую дату
  const targetDate = date || formatDate(new Date());
  
  return fetchWithTimezone(`/fixtures/date/${targetDate}`, {
    include: 'participants;league;venue'
  });
};

// Получение live-матчей
export const fetchLiveFixtures = async () => {
  // Явно указываем эндпоинт livescores/inplay
  return fetchWithTimezone('livescores/inplay', {
    include: 'participants;league;venue;scores'
  });
};

// Получение предстоящих матчей
export const fetchUpcomingFixtures = async (days: number = 7) => {
  // Получаем текущую дату
  const today = formatDate(new Date());
  
  // Получаем будущую дату
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateString = formatDate(futureDate);
  
  return fetchWithTimezone(`/fixtures/between/${today}/${futureDateString}`, {
    include: 'participants;league;venue'
  });
};

// Получение деталей конкретного матча
export const fetchFixtureDetails = async (fixtureId: string) => {
  return fetchWithTimezone(`/fixtures/${fixtureId}`, {
    include: 'participants;league;venue;scores;statistics'
  });
};

// Получение информации о команде
export const fetchTeamDetails = async (teamId: string) => {
  return fetchWithTimezone(`/teams/${teamId}`, {
    include: 'country;coach;venue;statistics'
  });
};

// Получение списка команд с поиском
export const fetchTeams = async (search?: string) => {
  const params: Record<string, string> = {
    include: 'country;league'
  };
  
  if (search) {
    params.search = search;
  }
  
  return fetchWithTimezone('/teams', params);
};

// Экспорт функции для изменения часового пояса пользователя
export const setUserTimezone = (timezone: string): void => {
  localStorage.setItem('userTimezone', timezone);
}; 