import React, { useState } from 'react';
import { useGetChatsQuery } from '../store/api/chatsApi';
import type { Chat } from '../types/api';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  MessageSquare, 
  Users,
  ChevronRight,
  Search,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChatsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: chats = [], isLoading } = useGetChatsQuery();

  const filteredChats = chats.filter((chat: Chat) =>
    chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.id.toString().includes(searchTerm)
  );

  const handleChatClick = (chatId: number) => {
    navigate(`/chats/${chatId}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Чаты</h1>
          <p className="text-gray-600 text-sm">
            Управляйте групповыми задачами через чаты
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Поиск чатов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Chats list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-2">
            {filteredChats.map((chat: Chat) => (
            <Card 
              key={chat.id}
              className="cursor-pointer transition-colors hover:bg-gray-50"
              onClick={() => handleChatClick(chat.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <h3 className="font-medium text-gray-900 text-sm">
                        {chat.title || `Чат #${chat.id}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{chat.users?.length || 0} участников</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        <span>Задачи</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {chat.updatedAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Нет чатов</h3>
            <p className="text-gray-600 text-sm mb-4">
              {searchTerm ? 'По вашему запросу ничего не найдено' : 'У вас пока нет групповых чатов'}
            </p>
            <p className="text-xs text-gray-500">
              Чаты создаются автоматически при работе с Telegram ботом
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
