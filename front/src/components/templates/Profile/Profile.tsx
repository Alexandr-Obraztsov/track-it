import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications,
  Save,
} from '@mui/icons-material';
import type { User, NotificationSettings } from '../../../types/api';

export interface ProfileProps {
  user: User;
  notificationSettings: NotificationSettings;
  onSaveProfile?: (user: Partial<User>) => void;
  onSaveNotifications?: (settings: NotificationSettings) => void;
  loading?: boolean;
}

export const Profile: React.FC<ProfileProps> = ({
  user,
  notificationSettings: initialSettings,
  onSaveProfile,
  onSaveNotifications,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [profileData, setProfileData] = useState({
    firstName: user.firstName,
    lastName: user.lastName || '',
    username: user.username || '',
  });

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleProfileChange = (field: keyof typeof profileData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveProfile = () => {
    onSaveProfile?.({
      firstName: profileData.firstName,
      lastName: profileData.lastName || null,
      username: profileData.username || null,
    });
  };

  const handleSaveNotifications = () => {
    onSaveNotifications?.(notificationSettings);
  };

  return (
    <Box
      sx={{
        p: 1.5,
        maxWidth: 800,
        mx: 'auto',
        width: '100%',
      }}
    >
      <Typography
        variant="h6"
        component="h1"
        sx={{
          mb: 1.5,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        Личный кабинет
      </Typography>

      <Stack spacing={1.5}>
        {/* Profile Section */}
        <Card
          sx={{
            borderRadius: 1.5,
            backgroundImage: 'none',
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              mb={1.5}
              flexDirection={isMobile ? 'column' : 'row'}
              textAlign={isMobile ? 'center' : 'left'}
            >
              <Avatar
                src={user.photoUrl || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.main',
                  fontSize: '1.125rem',
                }}
              >
                {user.firstName.charAt(0).toUpperCase()}
                {user.lastName?.charAt(0).toUpperCase() || ''}
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                >
                  {user.firstName} {user.lastName || ''}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem' }}
                >
                  @{user.username || 'без username'}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  ID: {user.telegramId || 'не указан'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1.5}>
              <TextField
                label="Имя"
                value={profileData.firstName}
                onChange={handleProfileChange('firstName')}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  },
                }}
              />

              <TextField
                label="Фамилия"
                value={profileData.lastName}
                onChange={handleProfileChange('lastName')}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  },
                }}
              />

              <TextField
                label="Username"
                value={profileData.username}
                onChange={handleProfileChange('username')}
                fullWidth
                placeholder="без username"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  },
                }}
              />

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProfile}
                disabled={loading}
                fullWidth={isMobile}
                size="small"
                sx={{
                  borderRadius: 1.5,
                  mt: 0.5,
                  py: 0.75,
                  fontSize: '0.875rem',
                }}
              >
                Сохранить изменения
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card
          sx={{
            borderRadius: 1.5,
            backgroundImage: 'none',
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              mb={1.5}
            >
              <Notifications color="primary" sx={{ fontSize: '1.125rem' }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, fontSize: '0.875rem' }}
              >
                Настройки уведомлений
              </Typography>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <Stack spacing={1.5}>
              {[
                {
                  key: 'taskAssigned' as const,
                  title: 'Назначение задач',
                  description: 'Уведомления при назначении задач на вас',
                },
                {
                  key: 'taskCompleted' as const,
                  title: 'Завершение задач',
                  description: 'Уведомления при завершении задач в ваших группах',
                },
                {
                  key: 'taskDeadline' as const,
                  title: 'Дедлайны задач',
                  description: 'Уведомления о приближающихся дедлайнах',
                },
                {
                  key: 'taskComment' as const,
                  title: 'Комментарии к задачам',
                  description: 'Уведомления о новых комментариях к вашим задачам',
                },
                {
                  key: 'dailyDigest' as const,
                  title: 'Ежедневная сводка',
                  description: 'Ежедневный отчет о задачах в ваших группах',
                },
                {
                  key: 'weeklyReport' as const,
                  title: 'Еженедельный отчет',
                  description: 'Еженедельный отчет о прогрессе в группах',
                },
              ].map((item, index, array) => (
                <React.Fragment key={item.key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings[item.key]}
                        onChange={() => handleNotificationChange(item.key)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.7rem',
                            display: 'block',
                            mt: 0.25,
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      m: 0,
                      width: '100%',
                      flexDirection: 'row-reverse',
                    }}
                  />
                  {index < array.length - 1 && <Divider />}
                </React.Fragment>
              ))}

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveNotifications}
                disabled={loading}
                fullWidth={isMobile}
                size="small"
                sx={{
                  borderRadius: 1.5,
                  mt: 1,
                  py: 0.75,
                  fontSize: '0.875rem',
                }}
              >
                Сохранить настройки
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
