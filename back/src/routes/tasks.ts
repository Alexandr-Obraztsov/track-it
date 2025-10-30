import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { Task } from '../entities/Task';
import { taskManager } from '../services/task-service/task-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/tasks/personal - личные задачи пользователя
router.get('/personal', authenticateToken, async (req: any, res) => {
  try {
    const tasks = await taskManager.getUserPersonalTasks(req.user.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/chat/:chatId - задачи чата
router.get('/chat/:chatId', async (req, res) => {
  try {
    const tasks = await taskManager.getChatTasks(parseInt(req.params.chatId));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - задача по ID
router.get('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid ID' });
    
    const task = await AppDataSource.getRepository(Task).findOne({
      where: { id: taskId },
      relations: ['assignedUser', 'assignedRole']
    });
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// PATCH /api/tasks/:id/status - изменить статус задачи
router.patch('/:id/status', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid ID' });
    
    const { status } = req.body;
    const validStatuses = ['backlog', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const taskRepo = AppDataSource.getRepository(Task);
    const result = await taskRepo.update(taskId, { status });
    
    if (result.affected === 0) return res.status(404).json({ error: 'Task not found' });
    
    const updatedTask = await taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignedUser', 'assignedRole']
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/tasks/:id - удалить задачу
router.delete('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid ID' });
    
    const result = await AppDataSource.getRepository(Task).delete(taskId);
    if (result.affected === 0) return res.status(404).json({ error: 'Task not found' });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export const taskRoutes: Router = router;