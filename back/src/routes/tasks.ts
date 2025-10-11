import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { Task } from '../entities/Task';
import { taskManager } from '../services/task-service/task-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/tasks - получить все задачи
router.get('/', authenticateToken, async (req, res) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.find({
      relations: ['chat', 'assignedUser', 'assignedRole']
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - получить задачу по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['chat', 'assignedUser', 'assignedRole']
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - создать новую задачу
router.post('/', async (req, res) => {
  try {
    const { title, description, chatId, assignedUserId, assignedRoleId, deadline } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = taskRepository.create({
      title,
      description,
      assignedUserId: assignedUserId || null,
      assignedRoleId: assignedRoleId || null,
      deadline: deadline ? new Date(deadline) : null
    });

    const savedTask = await taskRepository.save(task);
    const taskWithRelations = await taskRepository.findOne({
      where: { id: Array.isArray(savedTask) ? savedTask[0].id : savedTask.id },
      relations: ['chat', 'assignedUser', 'assignedRole']
    });

    res.status(201).json(taskWithRelations);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, chatId, assignedUserId, assignedRoleId, deadline } = req.body;

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Обновляем только переданные поля
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId;
    if (assignedRoleId !== undefined) task.assignedRoleId = assignedRoleId;
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;

    const updatedTask = await taskRepository.save(task);
    const taskWithRelations = await taskRepository.findOne({
      where: { id: updatedTask.id },
      relations: ['chat', 'assignedUser', 'assignedRole']
    });

    res.json(taskWithRelations);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - удалить задачу
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await taskRepository.remove(task);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET /api/tasks/personal/:userId - получить личные задачи пользователя
router.get('/personal/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await taskManager.getUserPersonalTasks(parseInt(userId));
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching personal tasks:', error);
    res.status(500).json({ error: 'Failed to fetch personal tasks' });
  }
});

// GET /api/tasks/assigned/:userId - получить групповые задачи пользователя (где он назначен исполнителем)
router.get('/assigned/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { chatId } = req.query;
    
    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.find({
      where: { assignedUserId: parseInt(userId) },
      relations: ['chat', 'assignedUser', 'assignedRole']
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ error: 'Failed to fetch assigned tasks' });
  }
});

// GET /api/tasks/chat/:chatId - получить групповые задачи чата
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const tasks = await taskManager.getChatTasks(parseInt(chatId));
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching chat tasks:', error);
    res.status(500).json({ error: 'Failed to fetch chat tasks' });
  }
});

export const taskRoutes: Router = router;
