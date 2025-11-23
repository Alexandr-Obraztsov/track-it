import React from 'react';
import { Box } from '@mui/material';
import {
  useDraggable,
} from '@dnd-kit/core';
import { TaskCard, type TaskCardProps } from '../../organisms/TaskCard';
import type { Task } from '../../../types/api';

export interface DraggableTaskCardProps {
  task: Task;
  cardProps: TaskCardProps;
  onCardClick: (task: Task) => void;
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  cardProps,
  onCardClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id.toString(),
    data: {
      type: 'task',
      task,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleCardClick = (e: React.MouseEvent) => {
    // Предотвращаем открытие попапа при клике на кнопки действий
    const target = e.target as HTMLElement;
    if (target.closest('[data-task-actions]')) {
      return;
    }
    // Не открываем попап если это было перетаскивание
    if (isDragging) {
      return;
    }
    onCardClick(task);
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      {...attributes}
      {...listeners}
      sx={{
        opacity: isDragging ? 0 : 1,
        visibility: isDragging ? 'hidden' : 'visible',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: isDragging ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <TaskCard {...cardProps} />
    </Box>
  );
};

