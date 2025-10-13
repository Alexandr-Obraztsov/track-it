import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetChatByIdQuery } from '../store/api/chatsApi';
import { useGetChatTasksQuery } from '../store/api/tasksApi';
import { useExtractTasksMutation } from '../store/api/geminiApi';
import type { Task } from '../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft,
  MessageSquare, 
  Users,
  CheckSquare,
  Plus,
  Mic,
  MicOff,
  Type,
  Volume2,
  User,
  Shield,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';

export const ChatDetailPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'roles'>('tasks');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data: chat, isLoading: chatLoading } = useGetChatByIdQuery(chatId || '');
  const { data: tasks = [], isLoading: tasksLoading } = useGetChatTasksQuery(chatId || '');
  const [extractTasks] = useExtractTasksMutation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка при записи аудио:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    try {
      const result = await extractTasks({
        audioData: audioBlob,
        type: 'group',
        chatId: parseInt(chatId || '0')
      }).unwrap();

      console.log('Задачи извлечены из аудио:', result);
    } catch (error) {
      console.error('Ошибка обработки аудио:', error);
    }
  };

  const processTextInput = async () => {
    if (!textInput.trim()) return;

    try {
      const result = await extractTasks({
        text: textInput,
        type: 'group',
        chatId: parseInt(chatId || '0')
      }).unwrap();

      console.log('Задачи извлечены из текста:', result);
      setTextInput('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Ошибка обработки текста:', error);
    }
  };

  if (chatLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Чат не найден</h3>
            <p className="text-gray-600 text-sm mb-4">
              Чат с ID {chatId} не существует или был удален
            </p>
            <Button onClick={() => navigate('/chats')}>
              Вернуться к списку чатов
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chats')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {chat.title || `Чат #${chat.id}`}
            </h1>
            <p className="text-gray-600 text-sm">
              Групповые задачи и управление
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => setShowTextInput(!showTextInput)} 
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать задачу
          </Button>
          <Button 
            onClick={() => setShowTextInput(!showTextInput)} 
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Type className="w-4 h-4" />
            Текстом
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                Остановить запись
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Голосом
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Text input for task creation */}
      {showTextInput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Создать задачи из текста</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Введите описание задач... Например: 'Нужно купить молоко, позвонить маме, подготовить отчет'"
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={processTextInput} disabled={!textInput.trim()}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Создать задачи
                </Button>
                <Button variant="outline" onClick={() => setShowTextInput(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'tasks'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Задачи ({tasks.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Участники ({chat.users?.length || 0})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'roles'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Роли ({chat.roles?.length || 0})
          </div>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task: Task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-xs mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {task.assignedUser && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{task.assignedUser.firstName}</span>
                          </div>
                        )}
                        {task.assignedRole && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>{task.assignedRole.title}</span>
                          </div>
                        )}
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8 text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Нет задач</h3>
                <p className="text-gray-600 text-sm mb-4">
                  В этом чате пока нет задач
                </p>
                <Button onClick={() => setShowTextInput(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первую задачу
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-3">
        {chat.users && chat.users.length > 0 ? (
          chat.users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-gray-600 text-xs">@{user.username}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Нет участников</h3>
                <p className="text-gray-600 text-sm">
                  В этом чате пока нет участников
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-3">
        {chat.roles && chat.roles.length > 0 ? (
          chat.roles.map((role) => (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {role.title}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Нет ролей</h3>
                <p className="text-gray-600 text-sm">
                  В этом чате пока нет ролей
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
