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
  alpha,
  useTheme,
  useMediaQuery,
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
    const members = chat.userChatRoles?.slice(0, 3) || [];
    return members.map((ucr) => ({
      name: `${ucr.user?.firstName || ''} ${ucr.user?.lastName || ''}`.trim(),
      photoUrl: ucr.user?.photoUrl || null,
    }));
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
      }}
    >
      <Typography
        variant="h6"
        component="h1"
        sx={{
          mb: 0.5,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        Выберите группу
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
          fontSize: '0.75rem',
        }}
      >
        Выберите группу для просмотра и управления задачами
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 } }}>
          <Typography color="text.secondary">Загрузка...</Typography>
        </Box>
      ) : chats.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 8, sm: 10 },
            px: 2,
          }}
        >
          <Group
            sx={{
              fontSize: { xs: 48, sm: 64 },
              color: 'text.secondary',
              mb: 2,
              opacity: 0.5,
            }}
          />
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Нет доступных групп
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              opacity: 0.7,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Создайте новую группу или дождитесь приглашения
          </Typography>
        </Box>
      ) : (
        <Stack spacing={{ xs: 1.5, sm: 2 }}>
          {chats.map((chat) => {
            const counts = getTaskCounts(chat);
            const membersCount = getMembersCount(chat);
            const memberAvatars = getMemberAvatars(chat);
            const isSelected = currentChatId === chat.id;

            return (
                     <Card
                       key={chat.id}
                       sx={{
                         transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                         border: '1.5px solid',
                         borderColor: isSelected
                           ? 'primary.main'
                           : 'rgba(255, 255, 255, 0.1)',
                         backgroundColor: isSelected
                           ? (theme: Theme) => alpha(theme.palette.primary.main, 0.1)
                           : 'transparent',
                         borderRadius: 1.5,
                         '&:hover': {
                           borderColor: 'primary.main',
                           transform: 'translateY(-1px)',
                           boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
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
                      p: { xs: 2, sm: 3 },
                      '&:last-child': { pb: { xs: 2, sm: 3 } },
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      gap={isMobile ? 1 : 2}
                    >
                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant={isMobile ? 'subtitle1' : 'h6'}
                          component="h3"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.2rem' },
                            mb: { xs: 1, sm: 1.5 },
                            color: isSelected ? 'primary.main' : 'text.primary',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {chat.title}
                        </Typography>

                               <Stack
                                 direction="row"
                                 spacing={0.5}
                                 flexWrap="wrap"
                                 gap={0.5}
                                 mb={1}
                               >
                                 <Chip
                                   icon={<Group fontSize="small" />}
                                   label={`${membersCount} участников`}
                                   size="small"
                                   sx={{
                                     backgroundColor: (theme: Theme) =>
                                       alpha(theme.palette.primary.main, 0.1),
                                     color: 'primary.main',
                                     border: '1px solid',
                                     borderColor: (theme: Theme) =>
                                       alpha(theme.palette.primary.main, 0.2),
                                     fontSize: '0.65rem',
                                     height: 20,
                                   }}
                                 />
                                 {counts.total > 0 && (
                                   <>
                                     <Chip
                                       label={`Всего: ${counts.total}`}
                                       size="small"
                                       sx={{
                                         backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                         color: 'text.secondary',
                                         fontSize: '0.65rem',
                                         height: 20,
                                       }}
                                     />
                                     {counts.inProgress > 0 && (
                                       <Chip
                                         label={`В работе: ${counts.inProgress}`}
                                         size="small"
                                         color="primary"
                                         sx={{
                                           fontSize: '0.65rem',
                                           height: 20,
                                         }}
                                       />
                                     )}
                                     {counts.completed > 0 && (
                                       <Chip
                                         label={`Выполнено: ${counts.completed}`}
                                         size="small"
                                         color="success"
                                         sx={{
                                           fontSize: '0.65rem',
                                           height: 20,
                                         }}
                                       />
                                     )}
                                   </>
                                 )}
                               </Stack>

                               {memberAvatars.length > 0 && (
                                 <Box display="flex" alignItems="center" gap={0.75}>
                                   <AvatarGroup
                                     max={3}
                                     sx={{
                                       '& .MuiAvatar-root': {
                                         width: 24,
                                         height: 24,
                                         fontSize: '0.7rem',
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
                                   {membersCount > 3 && (
                                     <Typography
                                       variant="caption"
                                       color="text.secondary"
                                       sx={{
                                         fontSize: '0.65rem',
                                       }}
                                     >
                                       +{membersCount - 3} еще
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
