import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Fade,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import type { User } from '../../../types/api';

export interface AssignUserDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (userId: number | null) => void;
  users: User[];
  taskTitle?: string;
}

export const AssignUserDialog: React.FC<AssignUserDialogProps> = ({
  open,
  onClose,
  onConfirm,
  users,
  taskTitle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  const handleConfirm = () => {
    onConfirm(selectedUserId === '' ? null : selectedUserId as number);
    setSelectedUserId('');
  };

  const handleClose = () => {
    setSelectedUserId('');
    onClose();
  };

  // Общий контент для обоих вариантов
  const content = (
    <>
      {/* Название задачи */}
      {taskTitle && (
        <Box
          sx={{
            mb: 1.5,
            p: 1,
            borderRadius: 1.5,
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            border: '1px solid',
            borderColor: 'rgba(25, 118, 210, 0.2)',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.7rem',
              mb: 0.25,
              fontWeight: 500,
            }}
          >
            Задача
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {taskTitle}
          </Typography>
        </Box>
      )}

      {/* Описание */}
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.875rem',
          mb: 1.5,
          color: 'text.secondary',
        }}
      >
        Выберите пользователя для назначения задачи
      </Typography>

      {/* Выбор пользователя */}
      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.875rem' }}>Пользователь</InputLabel>
        <Select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value as number | '')}
          label="Пользователь"
          sx={{
            borderRadius: 1.5,
            fontSize: '0.875rem',
            '& .MuiSelect-select': {
              fontSize: '0.875rem',
            },
          }}
        >
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id} sx={{ fontSize: '0.875rem' }}>
              {user.firstName} {user.lastName || ''}
              {user.username && ` (@${user.username})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  // Мобильная версия - шторка
  if (isMobile) {
    return (
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
            maxHeight: '85vh',
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
              Назначить задачу
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

          {content}

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
              onClick={handleConfirm}
              variant="contained"
              fullWidth
              disabled={selectedUserId === ''}
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
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              Назначить
            </Button>
          </Stack>
        </Box>
      </Drawer>
    );
  }

  // Десктопная версия - попап
  return (
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
          Назначить задачу
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

      <DialogContent>
        <Box py={2}>
          {content}
        </Box>
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
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedUserId === ''}
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
          Назначить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

