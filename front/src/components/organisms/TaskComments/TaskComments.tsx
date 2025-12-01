import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import { Send, Edit, Delete } from '@mui/icons-material';
import type { TaskComment, User } from '../../../types/api';
import { commentsApi } from '../../../api/comments';

export interface TaskCommentsProps {
  taskId: number;
  currentUser?: User | null;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  currentUser,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentsApi.getByTaskId(taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const created = await commentsApi.create({
        taskId,
        content: newComment.trim(),
      });
      setComments([...comments, created]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Ошибка при создании комментария');
    }
  };

  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) return;

    try {
      const updated = await commentsApi.update(commentId, {
        content: editContent.trim(),
      });
      setComments(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Ошибка при обновлении комментария');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Удалить этот комментарий?')) return;

    try {
      await commentsApi.delete(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Ошибка при удалении комментария');
    }
  };

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const isCurrentUser = (userId: number) => {
    // Сравниваем по id пользователя
    return currentUser?.id === userId;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}
      >
        Комментарии ({comments.length})
      </Typography>

      {/* Форма добавления комментария */}
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          multiline
          rows={3}
          placeholder="Написать комментарий..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              fontSize: '0.875rem',
            },
          }}
        />
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Send />}
          disabled={!newComment.trim() || loading}
          sx={{
            fontSize: '0.875rem',
            textTransform: 'none',
            borderRadius: 1.5,
            alignSelf: 'flex-end',
            px: 2.5,
            py: 1,
            fontWeight: 500,
          }}
        >
          Отправить
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Список комментариев */}
      {comments.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', py: 2 }}
        >
          Нет комментариев
        </Typography>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment) => (
            <Box
              key={comment.id}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {editingId === comment.id ? (
                <Stack spacing={1.5}>
                  <TextField
                    multiline
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      onClick={cancelEdit}
                      variant="outlined"
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        borderRadius: 1.5,
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={() => handleEdit(comment.id)}
                      variant="contained"
                      size="small"
                      disabled={!editContent.trim()}
                      sx={{
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        borderRadius: 1.5,
                      }}
                    >
                      Сохранить
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        bgcolor: 'primary.main',
                      }}
                    >
                      {comment.user
                        ? `${comment.user.firstName[0]}${comment.user.lastName?.[0] || ''}`
                        : '?'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                        >
                          {comment.user
                            ? `${comment.user.firstName} ${comment.user.lastName || ''}`
                            : 'Пользователь'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {formatDate(comment.createdAt)}
                          {comment.edited && ' (изменено)'}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {comment.content}
                      </Typography>
                    </Box>
                    {isCurrentUser(comment.userId) && (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => startEdit(comment)}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(comment.id)}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>
                </>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

