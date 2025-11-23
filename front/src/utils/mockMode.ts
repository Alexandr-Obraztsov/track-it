/**
 * Проверяет, включен ли режим моков
 * Управляется через переменную окружения VITE_USE_MOCKS
 * По умолчанию: false (используется реальный API)
 */
export const isMockMode = (): boolean => {
  const envValue = import.meta.env.VITE_USE_MOCKS;
  
  // Если переменная не установлена, используем реальный API
  if (envValue === undefined) {
    return false;
  }
  
  // Проверяем строковые значения 'true', '1', 'yes'
  return envValue === 'true' || envValue === '1' || envValue === 'yes';
};

