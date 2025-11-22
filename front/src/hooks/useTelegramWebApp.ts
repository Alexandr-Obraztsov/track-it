import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  // Aliases for convenience
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    chat?: {
      id: number;
      type: string;
      title?: string;
    };
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (id: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: {
    text?: string;
  }, callback?: (data: string) => void) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
  requestContact: (callback?: (granted: boolean) => void) => void;
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем, что мы в Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = WebApp;
      tg.ready();
      tg.expand();

      setWebApp(tg as unknown as TelegramWebApp);
      tg.setHeaderColor('#121212');
      tg.setBackgroundColor('#121212');
      
      // Преобразуем пользователя Telegram в наш формат
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const user: TelegramUser = {
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url,
          language_code: tgUser.language_code,
          // Aliases
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          photoUrl: tgUser.photo_url,
          languageCode: tgUser.language_code,
        };
        setUser(user);
      }
      setIsReady(true);
    } else {
      // Мок для разработки вне Telegram
      const mockUser: TelegramUser = {
        id: 123456789,
        first_name: 'Иван',
        last_name: 'Петров',
        username: 'ivan_petrov',
        language_code: 'ru',
        // Aliases
        firstName: 'Иван',
        lastName: 'Петров',
        photoUrl: undefined,
        languageCode: 'ru',
      };
      
      // Создаем мок webApp с initData для разработки
      const authDate = Math.floor(Date.now() / 1000);
      const mockInitData = `user=${encodeURIComponent(JSON.stringify({
        id: mockUser.id,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        username: mockUser.username,
        language_code: mockUser.language_code,
      }))}&auth_date=${authDate}`;
      
      const mockWebApp: TelegramWebApp = {
        initData: mockInitData,
        initDataUnsafe: {
          user: mockUser,
        },
        version: '6.0',
        platform: 'web',
        colorScheme: 'dark',
        themeParams: {
          bg_color: '#121212',
          text_color: '#ffffff',
        },
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        headerColor: '#121212',
        backgroundColor: '#121212',
        BackButton: {
          isVisible: false,
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {},
        },
        MainButton: {
          text: '',
          color: '',
          textColor: '',
          isVisible: false,
          isActive: false,
          isProgressVisible: false,
          setText: () => {},
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          showProgress: () => {},
          hideProgress: () => {},
          setParams: () => {},
        },
        HapticFeedback: {
          impactOccurred: () => {},
          notificationOccurred: () => {},
          selectionChanged: () => {},
        },
        ready: () => {},
        expand: () => {},
        close: () => {},
        sendData: () => {},
        openLink: () => {},
        openTelegramLink: () => {},
        openInvoice: () => {},
        showPopup: () => {},
        showAlert: () => {},
        showConfirm: () => {},
        showScanQrPopup: () => {},
        closeScanQrPopup: () => {},
        readTextFromClipboard: () => {},
        requestWriteAccess: () => {},
        requestContact: () => {},
      };
      
      setWebApp(mockWebApp);
      setUser(mockUser);
      setIsReady(true);
    }
  }, []);

  return {
    webApp,
    user,
    isReady,
  };
};

