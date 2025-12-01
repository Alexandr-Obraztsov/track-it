import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import type { Theme } from '@mui/material';
import { StatusChip } from '../../molecules/StatusChip';
import { UserChip } from '../../molecules/UserChip';
import { DeadlineChip } from '../../molecules/DeadlineChip';
import { LabelChip } from '../../molecules/LabelChip';
import { TaskActions } from '../../molecules/TaskActions';
import type { Label } from '../../../types/api';

export interface TaskCardProps {
  id: number;
  title: string;
  description?: string | null;
  status: 'backlog' | 'in_progress' | 'completed';
  assignedUser?: {
    id: number;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
  } | null;
  deadline?: string | null;
  label?: Label | null;
  onEdit?: (id: number) => void;
  onComment?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  status,
  assignedUser,
  deadline,
  label,
  onEdit,
  onComment,
  onDelete,
}) => {

  return (
    <Card
      sx={{
        opacity: status === 'completed' ? 0.75 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: (theme: Theme) =>
            status === 'completed'
              ? theme.palette.success.main
              : status === 'in_progress'
              ? theme.palette.primary.main
              : 'rgba(255, 255, 255, 0.15)',
          transition: 'all 0.2s ease',
        },
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          transform: 'translateY(-1px)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          '&::before': {
            width: 4,
          },
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} mb={description ? 1 : 0.5}>
              <Typography
                variant="subtitle2"
                component="h3"
                sx={{
                  flex: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  color: status === 'completed' ? 'text.secondary' : 'text.primary',
                  textDecoration: status === 'completed' ? 'line-through' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {title}
              </Typography>
              <StatusChip status={status} size="small" />
            </Box>

            {description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  lineHeight: 1.5,
                  fontSize: '0.75rem',
                  opacity: 0.8,
                }}
              >
                {description}
              </Typography>
            )}

            {(assignedUser || deadline || label) && (
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                sx={{ gap: 0.75 }}
              >
                {assignedUser && (
                  <UserChip
                    firstName={assignedUser.firstName}
                    lastName={assignedUser.lastName}
                    size="small"
                  />
                )}

                {deadline && <DeadlineChip deadline={deadline} size="small" />}

                {label && <LabelChip label={label} size="small" />}
              </Stack>
            )}
          </Box>

          <Box sx={{ flexShrink: 0 }} data-task-actions>
            <TaskActions
              onEdit={onEdit ? () => onEdit(id) : undefined}
              onComment={onComment ? () => onComment(id) : undefined}
              onDelete={onDelete ? () => onDelete(id) : undefined}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
