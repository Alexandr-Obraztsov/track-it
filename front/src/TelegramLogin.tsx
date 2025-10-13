import React, { useState } from 'react';
import TelegramLoginButton from 'react-telegram-login';

// Тип для данных пользователя из Telegram
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  // Другие поля по необходимости
}

const TelegramLogin: React.FC = () => {
  const [userData, setUserData] = useState<TelegramUser | null>(null);

  const handleTelegramResponse = (response: TelegramUser): void => {
    console.log('Данные пользователя:', response);
    setUserData(response);

  };

  const handleTelegramError = (error: any): void => {
    console.error('Ошибка авторизации:', error);
  };

  return (
    <div>
      <h2>Авторизация через Telegram</h2>
      {!userData ? (
        <TelegramLoginButton
          botName="track_it_tasks_bot"  // Замените на username вашего бота (без @)
          dataOnauth={handleTelegramResponse}
          dataOnError={handleTelegramError}
          size="large"  // Опции: small, medium, large
          requestAccess="write"  // Разрешение на запись (опционально)
          requestedFields="@username,@first_name,@last_name,@photo_url"  // Запрашиваемые поля
        />
      ) : (
        <div>
          <p>Добро пожаловать, {userData.first_name}!</p>
          {userData.photo_url && (
            <img src={userData.photo_url} alt="Фото профиля" style={{ width: '100px' }} />
          )}
          <p>ID: {userData.id}</p>
          {userData.username && <p>Username: @{userData.username}</p>}
          <button onClick={() => setUserData(null)}>Выйти</button>
        </div>
      )}
    </div>
  );
};

export default TelegramLogin;