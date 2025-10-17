import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar } from 'lucide-react';
import { type Task } from '@/types/api';

interface TaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
}

export const TaskCard = ({ task, onDelete }: TaskCardProps) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;
  const deleteThreshold = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    const distance = touchStart - currentTouch;
    
    // Ограничиваем свайп только вправо (влево от элемента)
    if (distance > 0) {
      setOffsetX(-Math.min(distance, 150));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (!touchStart || !touchEnd) {
      return;
    }

    const distance = touchStart - touchEnd;
    const isSwipe = distance > minSwipeDistance;

    if (isSwipe && distance > deleteThreshold) {
      setShowDelete(true);
      setOffsetX(-150);
    } else if (isSwipe) {
      setShowDelete(true);
      setOffsetX(-80);
    } else {
      setShowDelete(false);
      setOffsetX(0);
    }
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  const handleCardClick = () => {
    if (showDelete) {
      setShowDelete(false);
      setOffsetX(0);
    }
  };

  // Закрываем при клике вне карточки
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node) && showDelete) {
        setShowDelete(false);
        setOffsetX(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDelete]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div ref={cardRef} className="relative overflow-hidden">
      {/* Фон с кнопкой удаления */}
      <div className="absolute inset-0 flex items-center justify-end bg-destructive">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-6 text-destructive-foreground h-full"
        >
          <Trash2 className="h-5 w-5" />
          <span className="font-medium">Удалить</span>
        </button>
      </div>

      {/* Карточка задачи */}
      <Card
        className="relative cursor-pointer transition-transform touch-pan-y"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground line-clamp-2">
                {task.title}
              </h3>
              {task.deadline && (
                <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">{formatDate(task.deadline)}</span>
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            
            {(task.assignedUser || task.assignedRole) && (
              <div className="flex gap-2 pt-1">
                {task.assignedUser && (
                  <Badge variant="outline" className="text-xs">
                    {task.assignedUser.firstName}
                  </Badge>
                )}
                {task.assignedRole && (
                  <Badge variant="outline" className="text-xs">
                    {task.assignedRole.title}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

