import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Edit, Delete, Comment, Close } from '@mui/icons-material';
import { StatusChip } from '../../molecules/StatusChip';
import { UserChip } from '../../molecules/UserChip';
import { DeadlineChip } from '../../molecules/DeadlineChip';
import type { Task } from '../../../types/api';

export interface TaskDetailsDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onComment?: (taskId: number) => void;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  open,
  task,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          backgroundImage: 'none',
          m: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: isMobile ? 1 : 1.5,
          pt: isMobile ? 1.5 : 2,
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
            pr: 1,
            fontSize: isMobile ? '1.125rem' : '1rem',
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
      <DialogContent
        sx={{
          px: isMobile ? 2 : 3,
        }}
      >
        <Stack spacing={isMobile ? 2.5 : 2} py={1}>
          {/* Статус */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.7rem',
                mb: isMobile ? 1 : 0.5,
                display: 'block',
                fontWeight: 500,
              }}
            >
              Статус
            </Typography>
            <StatusChip status={task.status} size="small" />
          </Box>

          {/* Описание */}
          {task.description && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.75rem' : '0.7rem',
                    mb: isMobile ? 1 : 0.5,
                    display: 'block',
                    fontWeight: 500,
                  }}
                >
                  Описание
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: isMobile ? '0.9375rem' : '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  {task.description}
                </Typography>
              </Box>
            </>
          )}

          {/* Назначенный пользователь */}
          {task.assignedUser && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.75rem' : '0.7rem',
                    mb: isMobile ? 1 : 0.5,
                    display: 'block',
                    fontWeight: 500,
                  }}
                >
                  Исполнитель
                </Typography>
                <UserChip
                  firstName={task.assignedUser.firstName}
                  lastName={task.assignedUser.lastName}
                  size="small"
                />
              </Box>
            </>
          )}

          {/* Дедлайн */}
          {task.deadline && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.75rem' : '0.7rem',
                    mb: isMobile ? 1 : 0.5,
                    display: 'block',
                    fontWeight: 500,
                  }}
                >
                  Дедлайн
                </Typography>
                <DeadlineChip deadline={task.deadline} size="small" />
              </Box>
            </>
          )}

          {/* Дата создания */}
          {task.createdAt && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.75rem' : '0.7rem',
                    mb: isMobile ? 1 : 0.5,
                    display: 'block',
                    fontWeight: 500,
                  }}
                >
                  Создано
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.9375rem' : '0.875rem' }}
                >
                  {new Date(task.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: isMobile ? 2 : 3,
          pb: isMobile ? 3 : 2,
          pt: isMobile ? 2 : 1.5,
          gap: isMobile ? 1.5 : 1,
          flexDirection: isMobile ? 'column' : 'row',
          '& > *': {
            width: isMobile ? '100%' : 'auto',
            m: isMobile ? '0 !important' : '0',
          },
        }}
      >
        {onComment && (
          <Button
            startIcon={<Comment />}
            onClick={handleComment}
            variant="outlined"
            size={isMobile ? 'medium' : 'small'}
            fullWidth={isMobile}
            sx={{
              fontSize: isMobile ? '1rem' : '0.875rem',
              py: isMobile ? 1.25 : 0.5,
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
            size={isMobile ? 'medium' : 'small'}
            fullWidth={isMobile}
            sx={{
              fontSize: isMobile ? '1rem' : '0.875rem',
              py: isMobile ? 1.25 : 0.5,
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
            size={isMobile ? 'medium' : 'small'}
            fullWidth={isMobile}
            sx={{
              fontSize: isMobile ? '1rem' : '0.875rem',
              py: isMobile ? 1.25 : 0.5,
            }}
          >
            Удалить
          </Button>
        )}
        {!isMobile && (
          <Button
            onClick={onClose}
            variant="contained"
            size="small"
            sx={{ fontSize: '0.875rem', ml: 'auto' }}
          >
            Закрыть
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

