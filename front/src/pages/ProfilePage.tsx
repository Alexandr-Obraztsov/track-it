import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { logout } from '@/store/slices/authSlice';
import { LogOut, User as UserIcon, AtSign, Hash } from 'lucide-react';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstName = user.first_name?.[0] || '';
    const lastName = user.last_name?.[0] || '';
    return `${firstName}${lastName}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
  };

  return (
    <>
      <PageHeader
        title="Профиль"
        description="Информация о вашем аккаунте"
      />
      
      <div className="container mx-auto p-6 space-y-6 max-w-2xl">
      {/* Профиль карточка */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Аватар */}
            <Avatar className="h-24 w-24 border-4 border-primary/10">
              <AvatarImage src={user?.photo_url} alt={user?.first_name} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Имя и username */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {user?.first_name} {user?.last_name}
              </h1>
              {user?.username && (
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              )}
            </div>

            {/* Badge Telegram */}
            <Badge variant="secondary" className="text-xs">
              Telegram Account
            </Badge>
          </div>

          <Separator className="my-6" />

          {/* Информация */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Информация
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Имя</p>
                  <p className="font-medium text-foreground">
                    {user?.first_name} {user?.last_name}
                  </p>
                </div>
              </div>

              {user?.username && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <AtSign className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="font-medium text-foreground">@{user.username}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="font-medium text-foreground font-mono">{user?.id}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Кнопка выхода */}
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleLogout}
            size="lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default ProfilePage;

