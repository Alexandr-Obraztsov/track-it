import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { MessageSquare, Loader2, Users } from 'lucide-react';
import { useGetChatsQuery } from '@/store/api/chatsApi';

const ChatsPage = () => {
  const { data: chats, isLoading, error } = useGetChatsQuery();

  return (
    <>
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
          <Empty className="border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>Нет активных чатов</EmptyTitle>
              <EmptyDescription>
                Создайте первый чат для общения с командой и обсуждения задач
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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

