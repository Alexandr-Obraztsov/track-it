import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import type { Theme } from '@mui/material';
import {
  Group,
} from '@mui/icons-material';
import type { Chat } from '../../../types/api';

export interface GroupSelectionProps {
  chats: Chat[];
  currentChatId?: number | null;
  onSelectChat?: (chatId: number) => void;
  loading?: boolean;
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getTaskCounts = (chat: Chat) => {
    const tasks = chat.tasks || [];
    return {
      total: tasks.length,
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  };

  const getMembersCount = (chat: Chat) => {
    return chat.userChatRoles?.length || 0;
  };

  const getMemberAvatars = (chat: Chat) => {
    const members = chat.userChatRoles?.slice(0, 4) || [];
    return members.map((ucr) => ({
      name: `${ucr.user?.firstName || ''} ${ucr.user?.lastName || ''}`.trim(),
      photoUrl: ucr.user?.photoUrl || null,
    }));
  };

  const getProgressPercentage = (counts: ReturnType<typeof getTaskCounts>) => {
    if (counts.total === 0) return 0;
    return Math.round((counts.completed / counts.total) * 100);
  };

  const getOverdueTasks = (chat: Chat) => {
    const tasks = chat.tasks || [];
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.deadline || task.status === 'completed') return false;
      return new Date(task.deadline) < now;
    }).length;
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      {/* Заголовок секции */}
      <Box mb={3}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            mb: 0.5,
            color: 'text.primary',
          }}
        >
          Выберите группу
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            lineHeight: 1.5,
            opacity: 0.8,
          }}
        >
          Выберите группу для просмотра и управления задачами
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 } }}>
          <Typography color="text.secondary">Загрузка...</Typography>
        </Box>
      ) : chats.length === 0 ? (
        <Card
          sx={{
            textAlign: 'center',
            py: { xs: 6, sm: 8 },
            px: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed',
            borderColor: 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <Group
            sx={{
              fontSize: { xs: 64, sm: 80 },
              color: 'text.secondary',
              mb: 2,
              opacity: 0.4,
            }}
          />
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mb: 1,
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.125rem' },
            }}
          >
            Нет доступных групп
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              opacity: 0.7,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            Создайте новую группу или дождитесь приглашения от администратора
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {chats.map((chat) => {
            const counts = getTaskCounts(chat);
            const membersCount = getMembersCount(chat);
            const memberAvatars = getMemberAvatars(chat);
            const isSelected = currentChatId === chat.id;
            const progress = getProgressPercentage(counts);
            const overdueCount = getOverdueTasks(chat);

            return (
              <Card
                key={chat.id}
                sx={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid',
                  borderColor: isSelected
                    ? 'primary.main'
                    : 'rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected
                    ? (theme: Theme) => alpha(theme.palette.primary.main, 0.06)
                    : 'background.paper',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
                    backgroundColor: isSelected
                      ? (theme: Theme) => alpha(theme.palette.primary.main, 0.1)
                      : 'rgba(255, 255, 255, 0.03)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onSelectChat?.(chat.id)}
                  sx={{ p: 0 }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                    }}
                  >
                    {/* Заголовок и основная информация */}
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      gap={2}
                    >
                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: '0.9375rem', sm: '1rem' },
                            mb: 1.5,
                            color: isSelected ? 'primary.main' : 'text.primary',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {chat.title}
                        </Typography>

                        {/* Статистика */}
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          gap={1}
                          alignItems="center"
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {membersCount} {membersCount === 1 ? 'участник' : membersCount < 5 ? 'участника' : 'участников'}
                          </Typography>
                          
                          {counts.total > 0 && (
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                }}
                              >
                                • {counts.total} {counts.total === 1 ? 'задача' : counts.total < 5 ? 'задачи' : 'задач'}
                              </Typography>
                              
                              {counts.inProgress > 0 && (
                                <Typography
                                  variant="caption"
                                  color="primary.main"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  • {counts.inProgress} в работе
                                </Typography>
                              )}
                              
                              {progress > 0 && (
                                <Typography
                                  variant="caption"
                                  color="success.main"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  • {progress}% выполнено
                                </Typography>
                              )}
                            </>
                          )}
                        </Stack>

                        {/* Участники */}
                        {memberAvatars.length > 0 && (
                          <Box display="flex" alignItems="center" gap={1} mt={1.5}>
                            <AvatarGroup
                              max={4}
                              sx={{
                                '& .MuiAvatar-root': {
                                  width: 24,
                                  height: 24,
                                  fontSize: '0.7rem',
                                  border: '1.5px solid',
                                  borderColor: 'background.paper',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                              }}
                            >
                              {memberAvatars.map((member, idx) => (
                                <Avatar
                                  key={idx}
                                  src={member.photoUrl || undefined}
                                  alt={member.name}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            {membersCount > 4 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.7rem',
                                  opacity: 0.7,
                                }}
                              >
                                +{membersCount - 4}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
