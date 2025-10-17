import { Empty } from '@/components/Empty';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Plus, Loader2, Users } from 'lucide-react';
import { useGetChatsQuery } from '@/store/api/chatsApi';

const ChatsPage = () => {
  const { data: chats, isLoading, error } = useGetChatsQuery();

  const handleCreateChat = () => {
    console.log('Создать чат');
  };

  return (
    <>
      <PageHeader
        title="Чаты"
        description="Общение с командой"
        action={chats && chats.length > 0 ? {
          label: 'Создать',
          icon: Plus,
          onClick: handleCreateChat
        } : undefined}
      />

      <div className="container mx-auto p-6 space-y-4 max-w-2xl">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">
              Ошибка загрузки чатов
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && chats && chats.length === 0 && (
          <Empty
            icon={MessageSquare}
            title="Нет активных чатов"
            description="Создайте первый чат для общения с командой и обсуждения задач"
            action={{
              label: 'Создать чат',
              onClick: handleCreateChat
            }}
          />
        )}

        {!isLoading && !error && chats && chats.length > 0 && (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Card key={chat.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{chat.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>ID: {chat.messageId}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatsPage;

