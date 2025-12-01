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
  Typography,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Divider,
  Fade,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { Close, Edit, Delete } from '@mui/icons-material';
import type { Label } from '../../../types/api';
import { labelsApi } from '../../../api/labels';

export interface LabelManagerProps {
  open: boolean;
  onClose: () => void;
  chatId: number;
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
}

const DEFAULT_COLORS = [
  { name: 'Синий', value: '#3B82F6' },
  { name: 'Зеленый', value: '#10B981' },
  { name: 'Желтый', value: '#F59E0B' },
  { name: 'Красный', value: '#EF4444' },
  { name: 'Фиолетовый', value: '#8B5CF6' },
  { name: 'Розовый', value: '#EC4899' },
  { name: 'Голубой', value: '#06B6D4' },
  { name: 'Оранжевый', value: '#F97316' },
];

export const LabelManager: React.FC<LabelManagerProps> = ({
  open,
  onClose,
  chatId,
  labels,
  onLabelsChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '' });
  const [loading, setLoading] = useState(false);

  const handleEdit = (label: Label) => {
    setEditingLabel(label);
    setFormData({ name: label.name, color: label.color || '' });
  };

  const handleDelete = async (labelId: number) => {
    if (!confirm('Удалить эту метку?')) return;
    
    try {
      setLoading(true);
      await labelsApi.delete(labelId);
      onLabelsChange(labels.filter((l) => l.id !== labelId));
    } catch (error) {
      console.error('Failed to delete label:', error);
      alert('Ошибка при удалении метки');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Введите название метки');
      return;
    }

    try {
      setLoading(true);
      if (editingLabel) {
        // Обновляем существующую метку
        const updated = await labelsApi.update(editingLabel.id, {
          name: formData.name.trim(),
          color: formData.color || null,
        });
        onLabelsChange(labels.map((l) => (l.id === editingLabel.id ? updated : l)));
      } else {
        // Создаем новую метку
        const created = await labelsApi.create({
          chatId,
          name: formData.name.trim(),
          color: formData.color || null,
        });
        onLabelsChange([...labels, created]);
      }
      setFormData({ name: '', color: '' });
      setEditingLabel(null);
    } catch (error) {
      console.error('Failed to save label:', error);
      alert('Ошибка при сохранении метки');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', color: '' });
    setEditingLabel(null);
    onClose();
  };

  const content = (
    <Stack spacing={2}>
      {/* Форма создания/редактирования */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          {editingLabel ? 'Редактировать метку' : 'Создать новую метку'}
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Название метки"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            placeholder="Например: frontend, backend, дизайн"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                fontSize: '0.875rem',
              },
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.875rem' }}>Цвет (опционально)</InputLabel>
            <Select
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              label="Цвет (опционально)"
              sx={{
                borderRadius: 1.5,
                fontSize: '0.875rem',
                '& .MuiSelect-select': {
                  fontSize: '0.875rem',
                },
              }}
              renderValue={(value) => {
                if (!value) return 'Без цвета';
                const colorOption = DEFAULT_COLORS.find((c) => c.value === value);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: value,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      {colorOption?.name || value}
                    </Typography>
                  </Box>
                );
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Без цвета
                </Typography>
              </MenuItem>
              {DEFAULT_COLORS.map((color) => (
                <MenuItem key={color.value} value={color.value} sx={{ fontSize: '0.875rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: color.value,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                    <Typography sx={{ fontSize: '0.875rem' }}>{color.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !formData.name.trim()}
              sx={{
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: 1.5,
                flex: 1,
              }}
            >
              {editingLabel ? 'Сохранить' : 'Создать'}
            </Button>
            {editingLabel && (
              <Button
                onClick={() => {
                  setEditingLabel(null);
                  setFormData({ name: '', color: '' });
                }}
                variant="outlined"
                sx={{
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  borderRadius: 1.5,
                }}
              >
                Отмена
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      <Divider />

      {/* Список существующих меток */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Существующие метки ({labels.length})
        </Typography>
        {labels.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}
          >
            Нет созданных меток
          </Typography>
        ) : (
          <Stack spacing={1}>
            {labels.map((label) => (
              <Box
                key={label.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  {label.color && (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: label.color,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                  )}
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {label.name}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(label)}
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
                    onClick={() => handleDelete(label.id)}
                    disabled={loading}
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
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
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
            maxHeight: '90vh',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              mx: 'auto',
              mb: 1,
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
              Управление метками
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
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          Управление метками
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

      <DialogContent sx={{ pt: 2.5, px: 3, pb: 2 }}>{content}</DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 1.5 }}>
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
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};
