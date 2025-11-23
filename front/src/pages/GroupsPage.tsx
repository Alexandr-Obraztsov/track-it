import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupSelection } from '../components/templates/GroupSelection';
import type { Chat } from '../types/api';
import { mockChats } from '../mocks/data';
import { getBoardRoute } from '../constants/routes';
import { chatsApi } from '../api/chats';
import { isMockMode } from '../utils/mockMode';

export const GroupsPage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        if (isMockMode()) {
          // Используем моки
          setTimeout(() => {
            setChats(mockChats);
            setLoading(false);
          }, 500);
        } else {
          // Загружаем с бекенда
          const data = await chatsApi.getAll();
          setChats(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  const handleSelectChat = (chatId: number) => {
    navigate(getBoardRoute(chatId));
  };

  return (
    <GroupSelection
      chats={chats}
      currentChatId={null}
      onSelectChat={handleSelectChat}
      loading={loading}
    />
  );
};



