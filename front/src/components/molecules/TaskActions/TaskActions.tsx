import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  alpha,
} from '@mui/material';
import type { Theme } from '@mui/material';
import {
  MoreVert,
  Edit,
  Comment,
  Delete,
} from '@mui/icons-material';

export interface TaskActionsProps {
  onEdit?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
}

export const TaskActions: React.FC<TaskActionsProps> = ({
  onEdit,
  onComment,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleClose();
    onEdit?.();
  };

  const handleComment = () => {
    handleClose();
    onComment?.();
  };

  const handleDelete = () => {
    handleClose();
    onDelete?.();
  };

  // Если нет действий, не показываем кнопку
  if (!onEdit && !onComment && !onDelete) {
    return null;
  }

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          padding: 0.5,
          opacity: 0.6,
          transition: 'all 0.2s ease',
          '&:hover': {
            opacity: 1,
            backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1rem',
          },
        }}
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 160,
            mt: 0.5,
            backgroundColor: '#2d2d2d',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            '& .MuiMenuItem-root': {
              px: 1.5,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            },
            '& .MuiListItemIcon-root': {
              minWidth: 32,
              '& .MuiSvgIcon-root': {
                fontSize: '1rem',
              },
            },
            '& .MuiListItemText-primary': {
              fontSize: '0.875rem',
            },
          },
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="Редактировать" />
          </MenuItem>
        )}

        {onComment && (
          <MenuItem onClick={handleComment}>
            <ListItemIcon>
              <Comment fontSize="small" sx={{ color: 'info.main' }} />
            </ListItemIcon>
            <ListItemText primary="Добавить комментарий" />
          </MenuItem>
        )}

        {onDelete && (
          <>
            {(onEdit || onComment) && (
              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            )}
            <MenuItem
              onClick={handleDelete}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: (theme: Theme) => alpha(theme.palette.error.main, 0.15),
                },
              }}
            >
              <ListItemIcon>
                <Delete fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary="Удалить" />
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};
