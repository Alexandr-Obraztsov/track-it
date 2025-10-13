import React, { useState } from 'react';
import { useGetChatsQuery, useSendMessageMutation } from '../store/api/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User,
  Plus,
  Search
} from 'lucide-react';

export const ChatsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatForm, setShowNewChatForm] = useState(false);

  const { data: chats = [], isLoading } = useGetChatsQuery();
  const [sendMessage] = useSendMessageMutation();

  const filteredChats = chats.filter((chat: any) =>
    chat.id.toString().includes(searchTerm) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await sendMessage({
        chatId: selectedChat.id,
        message: newMessage,
        role: 'user'
      }).unwrap();
      setNewMessage('');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const startNewChat = () => {
    setShowNewChatForm(true);
  };

  const createNewChat = async () => {
    try {
      // Здесь можно добавить логику создания нового чата
      setShowNewChatForm(false);
    } catch (error) {
      console.error('Ошибка создания чата:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Чаты</h1>
          <p className="text-gray-600 text-sm">
            Общайтесь с ботом через чат
          </p>
        </div>
        <Button 
          onClick={startNewChat} 
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новый чат
        </Button>
      </div>

      <div className="space-y-4">
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
            {filteredChats.map((chat: any) => (
              <Card 
                key={chat.id}
                className={`cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Чат #{chat.id}</h3>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {chat.lastMessage || 'Нет сообщений'}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        chat.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chat.isActive ? '●' : '○'}
                      </span>
                      {chat.updatedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </p>
                      )}
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
              <p className="text-gray-500 text-sm">Нет чатов</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={startNewChat}
              >
                Начать новый чат
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Chat messages - показываем только если выбран чат */}
        {selectedChat && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="w-4 h-4" />
                Чат #{selectedChat.id}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedChat.isActive ? 'Активный чат' : 'Завершенный чат'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages area */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedChat.messages && selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((message: any, index: number) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === 'user' ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Bot className="w-3 h-3" />
                          )}
                          <span className="text-xs opacity-75">
                            {message.role === 'user' ? 'Вы' : 'Бот'}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.timestamp && (
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Нет сообщений в этом чате</p>
                    <p className="text-xs text-gray-400">Начните разговор с ботом</p>
                  </div>
                )}
              </div>

              {/* Message input */}
              {selectedChat.isActive && (
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Введите сообщение..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim()} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New chat modal */}
      {showNewChatForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Новый чат</CardTitle>
              <CardDescription>
                Создать новый чат с ботом для управления задачами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Новый чат будет создан и вы сможете начать общение с ботом для управления задачами.
                </p>
                <div className="flex gap-2">
                  <Button onClick={createNewChat} className="flex-1">
                    Создать чат
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewChatForm(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
