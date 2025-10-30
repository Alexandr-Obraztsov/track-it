import { useEffect } from 'react';

export const useTheme = () => {
  useEffect(() => {
    // Функция для применения темы
    const applyTheme = (isDark: boolean) => {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Проверяем системные настройки
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Применяем тему при первой загрузке
    applyTheme(mediaQuery.matches);

    // Слушаем изменения системной темы
    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Очистка при размонтировании
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
};
