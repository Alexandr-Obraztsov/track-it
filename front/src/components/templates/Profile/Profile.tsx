import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications,
  Schedule,
  Assignment,
  Add,
  Delete,
} from '@mui/icons-material';
import type { User, NotificationSettings } from '../../../types/api';

export interface ProfileProps {
  user: User;
  notificationSettings: NotificationSettings;
  onSaveNotifications?: (settings: NotificationSettings) => void;
  loading?: boolean;
}

export const Profile: React.FC<ProfileProps> = ({
  user,
  notificationSettings: initialSettings,
  onSaveNotifications,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const lastSettingsRef = useRef<string>('');

  // Синхронизируем локальное состояние с пропсами при их изменении
  useEffect(() => {
    const currentSettingsStr = JSON.stringify(initialSettings);
    if (lastSettingsRef.current !== currentSettingsStr) {
      lastSettingsRef.current = currentSettingsStr;
      if (!isInitialMount.current) {
        setNotificationSettings(initialSettings);
      } else {
        isInitialMount.current = false;
      }
    }
  }, [initialSettings]);

  // Автосохранение с debounce
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    // Очищаем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Устанавливаем новый таймаут для сохранения
    saveTimeoutRef.current = setTimeout(() => {
      onSaveNotifications?.(notificationSettings);
    }, 500); // Сохраняем через 500ms после последнего изменения

    // Очистка при размонтировании
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notificationSettings, onSaveNotifications]);

  const handleTimeChange = (value: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      dailyDigestTime: value,
    }));
  };

  const handleAddReminder = () => {
    setNotificationSettings((prev) => ({
      ...prev,
      deadlineReminderHours: [...prev.deadlineReminderHours, 24],
    }));
  };

  const handleRemoveReminder = (index: number) => {
    setNotificationSettings((prev) => ({
      ...prev,
      deadlineReminderHours: prev.deadlineReminderHours.filter((_, i) => i !== index),
    }));
  };

  const handleReminderChange = (index: number, value: number) => {
    setNotificationSettings((prev) => ({
      ...prev,
      deadlineReminderHours: prev.deadlineReminderHours.map((hours, i) => 
        i === index ? value : hours
      ),
    }));
  };

  // Генерируем опции для времени (каждый час от 00:00 до 23:00)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        maxWidth: 800,
        mx: 'auto',
        width: '100%',
      }}
    >
      <Stack spacing={2}>
        {/* Profile Section */}
        <Card
          sx={{
            borderRadius: 2,
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.8) 0%, rgba(156, 39, 176, 0.8) 100%)',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              flexDirection={isMobile ? 'column' : 'row'}
              textAlign={isMobile ? 'center' : 'left'}
            >
              <Avatar
                src={user.photoUrl || undefined}
                sx={{
                  width: { xs: 64, sm: 72 },
                  height: { xs: 64, sm: 72 },
                  bgcolor: 'primary.main',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  fontWeight: 600,
                  border: '3px solid',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                {user.firstName.charAt(0).toUpperCase()}
                {user.lastName?.charAt(0).toUpperCase() || ''}
              </Avatar>
              <Box flex={1}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    mb: 0.5,
                  }}
                >
                  {user.firstName} {user.lastName || ''}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    mb: 0.5,
                  }}
                >
                  @{user.username || 'без username'}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.7rem',
                    }}
                  >
                    Telegram ID: {user.telegramId || 'не указан'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card
          sx={{
            borderRadius: 2,
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              mb={2}
              sx={{
                pb: 1.5,
                borderBottom: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(25, 118, 210, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Notifications color="primary" sx={{ fontSize: '1.25rem' }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.9375rem', sm: '1rem' },
                }}
              >
                Настройки уведомлений
              </Typography>
            </Box>

            <Stack spacing={3}>
              {/* Ежедневный список задач */}
              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1.5}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  }}
                >
                  <Assignment sx={{ fontSize: '1.125rem', color: 'primary.main' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Ежедневный список задач
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    mb: 1.5,
                    display: 'block',
                  }}
                >
                  Выберите время, когда вы будете получать ежедневный список всех задач, назначенных на вас
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>
                    Время получения
                  </InputLabel>
                  <Select
                    value={notificationSettings.dailyDigestTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    label="Время получения"
                    sx={{
                      fontSize: '0.875rem',
                      borderRadius: 1.5,
                    }}
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Напоминания о дедлайнах */}
              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1.5}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }}
                  >
                    <Schedule sx={{ fontSize: '1.125rem', color: 'primary.main' }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      Напоминания о дедлайнах
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddReminder}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      minWidth: 'auto',
                    }}
                  >
                    Добавить
                  </Button>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    mb: 1.5,
                    display: 'block',
                  }}
                >
                  Выберите, за сколько часов до дедлайна вы хотите получать уведомления. Можно добавить несколько напоминаний.
                </Typography>
                <Stack spacing={1.5}>
                  {notificationSettings.deadlineReminderHours.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 2,
                        px: 2,
                        borderRadius: 1.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px dashed',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Нет напоминаний. Нажмите "Добавить", чтобы создать напоминание.
                      </Typography>
                    </Box>
                  ) : (
                    notificationSettings.deadlineReminderHours.map((hours, index) => (
                      <Box
                        key={index}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <FormControl size="small" sx={{ flex: 1 }}>
                          <InputLabel sx={{ fontSize: '0.875rem' }}>
                            За сколько часов
                          </InputLabel>
                          <Select
                            value={hours}
                            onChange={(e) => handleReminderChange(index, Number(e.target.value))}
                            label="За сколько часов"
                            sx={{
                              fontSize: '0.875rem',
                              borderRadius: 1.5,
                            }}
                          >
                            <MenuItem value={1}>1 час</MenuItem>
                            <MenuItem value={3}>3 часа</MenuItem>
                            <MenuItem value={6}>6 часов</MenuItem>
                            <MenuItem value={12}>12 часов</MenuItem>
                            <MenuItem value={24}>1 день</MenuItem>
                            <MenuItem value={48}>2 дня</MenuItem>
                            <MenuItem value={72}>3 дня</MenuItem>
                            <MenuItem value={168}>1 неделя</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={() => handleRemoveReminder(index)}
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
