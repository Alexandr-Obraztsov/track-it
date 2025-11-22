import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupSelection } from '../components/templates/GroupSelection';
import type { Chat } from '../types/api';
import { mockChats } from '../mocks/data';
import { getBoardRoute } from '../constants/routes';

export const GroupsPage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Загрузить чаты с бекенда
    // Пока используем моки
    setTimeout(() => {
      setChats(mockChats);
      setLoading(false);
    }, 500);
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



