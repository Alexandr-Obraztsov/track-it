import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Button,
  TextField,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
  Fade,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

export interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  assignedUsers?: Array<{
    id: number;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
  }>;
}

export interface TaskFormData {
  title: string;
  description: string;
  assignedUserId: number | null;
  deadline: Date | null;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  assignedUsers = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignedUserId: initialData?.assignedUserId || null,
    deadline: initialData?.deadline ? new Date(initialData.deadline) : null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  const handleChange = (field: keyof TaskFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = 'target' in event ? event.target.value : event;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      deadline: date,
    }));
  };

  const handleSubmit = () => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      assignedUserId: null,
      deadline: null,
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      title: initialData?.title || '',
      description: initialData?.description || '',
      assignedUserId: initialData?.assignedUserId || null,
      deadline: initialData?.deadline ? new Date(initialData.deadline) : null,
    });
    setErrors({});
    onClose();
  };

  // Общий контент формы
  const formContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Название задачи"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              required
              fullWidth
        autoFocus={!isMobile}
              variant="outlined"
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
              label="Описание"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
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

            {assignedUsers.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Назначить на</InputLabel>
                <Select
                  value={formData.assignedUserId || ''}
                  onChange={(e) => handleChange('assignedUserId')({ target: { value: e.target.value || null } })}
                  label="Назначить на"
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiSelect-select': {
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>Не назначено</Typography>
                  </MenuItem>
                  {assignedUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id} sx={{ fontSize: '0.875rem' }}>
                      {user.firstName} {user.lastName || ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

      <DateTimePicker
              label="Дедлайн"
              value={formData.deadline}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                    },
                  },
                },
              }}
            />
          </Box>
  );

  // Мобильная версия - шторка
  if (isMobile) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <Drawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          slotProps={{
            transition: {
              direction: 'up',
              timeout: { enter: 300, exit: 200 },
            },
          }}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundImage: 'none',
              maxHeight: '90vh',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              pt: 1.5,
              pb: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Индикатор шторки */}
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                mx: 'auto',
                mb: 1,
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            />

            {/* Заголовок */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.125rem',
                }}
              >
                {initialData ? 'Редактировать задачу' : 'Создать задачу'}
              </Typography>
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {formContent}

            {/* Кнопки */}
            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button
                onClick={handleClose}
                variant="outlined"
                fullWidth
                sx={{
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  borderRadius: 1.5,
                  py: 1.25,
                  fontWeight: 500,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                fullWidth
                sx={{
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  borderRadius: 1.5,
                  py: 1.25,
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                  },
                }}
              >
                {initialData ? 'Сохранить' : 'Создать'}
              </Button>
            </Stack>
          </Box>
        </Drawer>
      </LocalizationProvider>
    );
  }

  // Десктопная версия - попап
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slots={{ transition: Fade }}
        slotProps={{
          transition: { timeout: 300 },
          paper: {
            sx: {
              borderRadius: 2,
              backgroundImage: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pt: 3,
            pb: 1.5,
            px: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.125rem',
            }}
          >
            {initialData ? 'Редактировать задачу' : 'Создать задачу'}
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, px: 3, pb: 2 }}>
          {formContent}
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: 1.5,
              px: 2.5,
              py: 1,
              fontWeight: 500,
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: 1.5,
              px: 2.5,
              py: 1,
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
            }}
          >
            {initialData ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
