import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { type Task } from '@/types/api';
import { useUpdateTaskStatusMutation } from '@/store/api/tasksApi';
import { Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
}

export const TaskCard = ({ task, onDelete }: TaskCardProps) => {
  const navigate = useNavigate();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusChange = async (checked: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const newStatus = checked ? 'completed' : 'backlog';
      await updateTaskStatus({ id: task.id, status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleCardClick = () => {
    // При клике на карточку открываем страницу редактирования
    navigate(`/tasks/${task.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(task.id);
    setShowDeleteDialog(false);
  };

  const isCompleted = task.status === 'completed';
  
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const isOverdue = date < now && !isCompleted;
    
    const dateStr = date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return {
      text: `${dateStr} ${timeStr}`,
      isOverdue
    };
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        layout: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2 },
        y: { duration: 0.2 }
      }}
    >
      <Card className={`transition-all duration-200 cursor-pointer group ${
        isCompleted ? 'bg-muted/30' : 'hover:shadow-sm'
      }`} onClick={handleCardClick}>
      <CardContent>
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isCompleted}
            className="mt-0.5 shrink-0"
            onCheckedChange={(checked) => handleStatusChange(!!checked)}
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm leading-tight flex-1 ${
                isCompleted 
                  ? 'line-through text-muted-foreground' 
                  : 'text-foreground'
              }`}>
                {task.title}
              </p>
              
              <div className="flex items-center gap-2 shrink-0">
                {task.deadline && (
                  <Badge 
                    variant={formatDeadline(task.deadline).isOverdue ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDeadline(task.deadline).text}
                  </Badge>
                )}
                
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 transition-all"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы уверены, что хотите удалить задачу "{task.title}"? 
                        Это действие нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            {task.description && (
              <p className={`text-xs mt-1 leading-tight ${
                isCompleted 
                  ? 'text-muted-foreground/60' 
                  : 'text-muted-foreground'
              }`}>
                {task.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};