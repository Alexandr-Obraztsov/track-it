import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import { Edit, Delete, Comment, Close } from '@mui/icons-material';
import { StatusChip } from '../../molecules/StatusChip';
import { UserChip } from '../../molecules/UserChip';
import { DeadlineChip } from '../../molecules/DeadlineChip';
import { LabelChip } from '../../molecules/LabelChip';
import { TaskComments } from '../TaskComments';
import type { Task, User } from '../../../types/api';

export interface TaskDetailsDialogProps {
  open: boolean;
  task: Task | null;
  currentUser?: User | null;
  onClose: () => void;
  onEdit?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onComment?: (taskId: number) => void;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  open,
  task,
  currentUser,
  onClose,
  onEdit,
  onDelete,
  onComment,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!task) return null;

  const handleEdit = () => {
    onClose();
    onEdit?.(task.id);
  };

  const handleDelete = () => {
    onClose();
    onDelete?.(task.id);
  };

  const handleComment = () => {
    onClose();
    onComment?.(task.id);
  };

  // Общий контент для обоих вариантов
  const content = (
    <Stack spacing={1.5} pt={1.5}>
      {/* Описание */}
      {task.description && (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'text.primary',
            }}
          >
            {task.description}
          </Typography>
        </Box>
      )}

      {/* Информационная панель */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <StatusChip status={task.status} size="small" />
        {task.assignedUser && (
          <UserChip
            firstName={task.assignedUser.firstName}
            lastName={task.assignedUser.lastName}
            size="small"
          />
        )}
        {task.deadline && (
          <DeadlineChip deadline={task.deadline} size="small" />
        )}
        {task.label && (
          <LabelChip label={task.label} size="small" />
        )}
      </Box>

      {/* Дополнительная информация */}
      {(task.createdAt || task.deadline) && (
        <Box
          sx={{
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          {task.deadline && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.7rem', fontWeight: 500 }}
              >
                Дедлайн
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
              >
                {new Date(task.deadline).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
          {task.createdAt && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.7rem', fontWeight: 500 }}
              >
                Создано
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.75rem' }}
              >
                {new Date(task.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Комментарии */}
      <Divider sx={{ my: 2 }} />
      <TaskComments taskId={task.id} currentUser={currentUser} />
    </Stack>
  );

  // Кнопки действий
  const actions = (
    <>
      {onComment && (
        <Button
          startIcon={<Comment />}
          onClick={handleComment}
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            fontSize: '0.875rem',
            textTransform: 'none',
            borderRadius: 1.5,
            py: isMobile ? 1.25 : 1,
            fontWeight: 500,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Комментарии
        </Button>
      )}
      {onEdit && (
        <Button
          startIcon={<Edit />}
          onClick={handleEdit}
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            fontSize: '0.875rem',
            textTransform: 'none',
            borderRadius: 1.5,
            py: isMobile ? 1.25 : 1,
            fontWeight: 500,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Редактировать
        </Button>
      )}
      {onDelete && (
        <Button
          startIcon={<Delete />}
          onClick={handleDelete}
          variant="outlined"
          color="error"
          fullWidth={isMobile}
          sx={{
            fontSize: '0.875rem',
            textTransform: 'none',
            borderRadius: 1.5,
            py: isMobile ? 1.25 : 1,
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
            },
          }}
        >
          Удалить
        </Button>
      )}
      {!isMobile && (
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            fontSize: '0.875rem',
            textTransform: 'none',
            borderRadius: 1.5,
            px: 2.5,
            py: 1,
            fontWeight: 500,
            ml: 'auto',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
          }}
        >
          Закрыть
        </Button>
      )}
    </>
  );

  // Мобильная версия - шторка
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
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
                flex: 1,
                pr: 1,
                lineHeight: 1.4,
              }}
            >
              {task.title}
            </Typography>
            <IconButton
              onClick={onClose}
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
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {actions}
          </Stack>
        </Box>
      </Drawer>
    );
  }

  // Десктопная версия - попап
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            flex: 1,
            pr: 1,
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </Typography>
        <IconButton
          onClick={onClose}
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
        {content}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 1.5,
          gap: 1.5,
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
};

