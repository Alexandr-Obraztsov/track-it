import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { Task } from '../entities/Task';
import { Chat } from '../entities/Chat';
import { ChatTask } from '../entities/ChatTask';
import { taskManager } from '../services/task-service/task-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/tasks/chat/:chatId - задачи чата
router.get('/chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const tasks = await taskManager.getChatTasks(parseInt(req.params.chatId));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - задача по ID
router.get('/:id', authenticateToken, async (req, res) => {
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

// POST /api/tasks - создать новую задачу
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, assignedUserId, assignedRoleId, deadline, status, chatId } = req.body;
    
    if (!title || !chatId) {
      return res.status(400).json({ error: 'Title and chatId are required' });
    }
    
    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({ where: { id: parseInt(chatId) } });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const taskRepository = AppDataSource.getRepository(Task);
    const task = taskRepository.create({
      title,
      description: description || null,
      assignedUserId: assignedUserId || null,
      assignedRoleId: assignedRoleId || null,
      deadline: deadline ? new Date(deadline) : null,
      status: status || 'backlog',
      chat,
    });
    
    const savedTask = await taskRepository.save(task);
    
    // Создаем связь через ChatTask
    const chatTaskRepository = AppDataSource.getRepository(ChatTask);
    const chatTask = chatTaskRepository.create({
      chatId: chat.id,
      taskId: savedTask.id,
    });
    await chatTaskRepository.save(chatTask);
    
    // Загружаем задачу с отношениями
    const taskWithRelations = await taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignedUser', 'assignedRole'],
    });
    
    res.status(201).json(taskWithRelations);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - обновить задачу
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid ID' });
    
    const { title, description, assignedUserId, assignedRoleId, deadline, status } = req.body;
    
    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignedUser', 'assignedRole'],
    });
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId;
    if (assignedRoleId !== undefined) task.assignedRoleId = assignedRoleId;
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) {
      const validStatuses = ['backlog', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      task.status = status;
    }
    
    const updatedTask = await taskRepo.save(task);
    
    // Загружаем с отношениями
    const taskWithRelations = await taskRepo.findOne({
      where: { id: updatedTask.id },
      relations: ['assignedUser', 'assignedRole'],
    });
    
    res.json(taskWithRelations);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - изменить статус задачи
router.patch('/:id/status', authenticateToken, async (req, res) => {
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
router.delete('/:id', authenticateToken, async (req, res) => {
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