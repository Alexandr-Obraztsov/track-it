import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            backgroundImage: 'none',
            m: isMobile ? 0 : 2,
            maxHeight: isMobile ? '100vh' : '90vh',
            pt: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: isMobile ? 1 : 1.5,
            pt: isMobile ? 1 : 2,
            px: isMobile ? 2 : 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: isMobile ? '1.125rem' : '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              flex: 1,
              fontSize: isMobile ? '1.125rem' : '1rem',
              lineHeight: 1.4,
            }}
          >
            {initialData ? 'Редактировать задачу' : 'Создать задачу'}
          </Typography>
          {isMobile && (
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
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 2 }}>
            <TextField
              label="Название задачи"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              required
              fullWidth
              autoFocus
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

            <DatePicker
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
        </DialogContent>
        <DialogActions
          sx={{
            px: isMobile ? 2 : 2,
            py: isMobile ? 2 : 1.5,
            pt: isMobile ? 2 : 1.5,
            pb: isMobile ? 3 : 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: isMobile ? 1.5 : 1,
            flexDirection: isMobile ? 'column' : 'row',
            '& > *': {
              width: isMobile ? '100%' : 'auto',
              m: isMobile ? '0 !important' : '0',
            },
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            size={isMobile ? 'medium' : 'small'}
            fullWidth={isMobile}
            sx={{
              borderRadius: 1.5,
              fontSize: isMobile ? '1rem' : '0.875rem',
              py: isMobile ? 1.25 : 0.5,
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            size={isMobile ? 'medium' : 'small'}
            fullWidth={isMobile}
            sx={{
              borderRadius: 1.5,
              px: isMobile ? 2 : 2,
              fontSize: isMobile ? '1rem' : '0.875rem',
              py: isMobile ? 1.25 : 0.5,
            }}
          >
            {initialData ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
