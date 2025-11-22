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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications,
  Save,
  Schedule,
  Assignment,
  Warning,
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

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNumberChange = (key: keyof NotificationSettings) => (
    event: { target: { value: string } }
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: Number(event.target.value),
    }));
  };

  const handleSelectChange = (key: keyof NotificationSettings) => (
    event: { target: { value: string } }
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
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

            <Stack spacing={2}>
              {/* Основные уведомления */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 1,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Основные уведомления
                </Typography>
                <Stack spacing={1}>
                  {[
                    {
                      key: 'taskAssigned' as const,
                      title: 'Назначение задач',
                      description: 'Уведомления при назначении задач на вас',
                    },
                    {
                      key: 'newTaskNotification' as const,
                      title: 'Новые задачи',
                      description: 'Уведомления о новых задачах в ваших группах',
                    },
                    {
                      key: 'statusChangeNotification' as const,
                      title: 'Изменение статуса',
                      description: 'Уведомления об изменении статуса задач',
                    },
                    {
                      key: 'taskUpdateNotification' as const,
                      title: 'Обновление задач',
                      description: 'Уведомления об обновлении задач',
                    },
                    {
                      key: 'taskComment' as const,
                      title: 'Комментарии',
                      description: 'Уведомления о новых комментариях к вашим задачам',
                    },
                    {
                      key: 'taskCompleted' as const,
                      title: 'Завершение задач',
                      description: 'Уведомления при завершении задач в ваших группах',
                    },
                  ].map((item) => (
                    <FormControlLabel
                      key={item.key}
                      control={
                        <Switch
                          checked={notificationSettings[item.key] as boolean}
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
                              fontSize: '0.8rem',
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
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Настройки дедлайнов */}
              <Box>
                <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                  <Schedule sx={{ fontSize: '1rem', color: 'primary.main' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Дедлайны
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.taskDeadline}
                        onChange={() => handleNotificationChange('taskDeadline')}
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
                            fontSize: '0.8rem',
                          }}
                        >
                          Уведомления о дедлайнах
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
                          Получать уведомления о приближающихся дедлайнах
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
                  
                  {notificationSettings.taskDeadline && (
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.8rem' }}>
                        Напоминать за
                      </InputLabel>
                      <Select
                        value={notificationSettings.deadlineReminderHours}
                        onChange={handleNumberChange('deadlineReminderHours')}
                        label="Напоминать за"
                        sx={{
                          fontSize: '0.8rem',
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
                  )}
                </Stack>
              </Box>

              <Divider />

              {/* Просроченные задачи */}
              <Box>
                <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                  <Warning sx={{ fontSize: '1rem', color: 'warning.main' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Просроченные задачи
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.overdueTasksReminder}
                        onChange={() => handleNotificationChange('overdueTasksReminder')}
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
                            fontSize: '0.8rem',
                          }}
                        >
                          Напоминания о просроченных задачах
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
                          Получать напоминания о задачах с просроченным дедлайном
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

                  {notificationSettings.overdueTasksReminder && (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.overdueTasksList}
                            onChange={() => handleNotificationChange('overdueTasksList')}
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
                                fontSize: '0.8rem',
                              }}
                            >
                              Список просроченных задач
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
                              Включать список просроченных задач в уведомления
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

                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: '0.8rem' }}>
                          Частота напоминаний
                        </InputLabel>
                        <Select
                          value={notificationSettings.overdueReminderFrequency}
                          onChange={handleSelectChange('overdueReminderFrequency')}
                          label="Частота напоминаний"
                          sx={{
                            fontSize: '0.8rem',
                            borderRadius: 1.5,
                          }}
                        >
                          <MenuItem value="daily">Ежедневно</MenuItem>
                          <MenuItem value="weekly">Еженедельно</MenuItem>
                          <MenuItem value="never">Никогда</MenuItem>
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Stack>
              </Box>

              <Divider />

              {/* Отчеты */}
              <Box>
                <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                  <Assignment sx={{ fontSize: '1rem', color: 'primary.main' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Отчеты
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {[
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
                  ].map((item) => (
                    <FormControlLabel
                      key={item.key}
                      control={
                        <Switch
                          checked={notificationSettings[item.key] as boolean}
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
                              fontSize: '0.8rem',
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
                  ))}
                </Stack>
              </Box>

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
