import { Router, Request } from 'express';
import { AppDataSource } from '../configs/database';
import { Task } from '../entities/Task';
import { Chat } from '../entities/Chat';
import { ChatTask } from '../entities/ChatTask';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Label } from '../entities/Label';
import { taskManager } from '../services/task-service/task-service';
import { taskHistoryService } from '../services/taskHistoryService';
import { getTelegramId } from '../utils/getTelegramId';

const router = Router();

// GET /api/tasks/chat/:chatId - задачи чата
router.get('/chat/:chatId', async (req: Request, res) => {
  try {
    const tasks = await taskManager.getChatTasks(parseInt(req.params.chatId));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - задача по ID
router.get('/:id', async (req: Request, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const task = await AppDataSource.getRepository(Task).findOne({
      where: { id: taskId },
      relations: ['assignedUser', 'assignedRole', 'chat', 'label']
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
router.post('/', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    if (!telegramId) {
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const { title, description, assignedTelegramId, assignedRoleId, deadline, status, chatId, labelId } = req.body;
    
    // Валидация обязательных полей
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }
    
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    const chatIdNum = parseInt(chatId);
    if (isNaN(chatIdNum)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }
    
    // Валидация статуса
    const validStatuses = ['backlog', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({ where: { id: chatIdNum } });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Валидация assignedTelegramId и assignedRoleId
    if (assignedTelegramId !== undefined && assignedTelegramId !== null) {
      const assignedTelegramIdNum = typeof assignedTelegramId === 'number' ? assignedTelegramId : parseInt(assignedTelegramId);
      if (isNaN(assignedTelegramIdNum)) {
        return res.status(400).json({ error: 'Invalid assignedTelegramId' });
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { telegramId: assignedTelegramIdNum } });
      if (!user) {
        return res.status(404).json({ error: 'Assigned user not found' });
      }
    }

    if (assignedRoleId !== undefined && assignedRoleId !== null) {
      const roleId = parseInt(assignedRoleId);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: 'Invalid assignedRoleId' });
      }
      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({ where: { id: roleId } });
      if (!role) {
        return res.status(404).json({ error: 'Assigned role not found' });
      }
    }

    let normalizedLabelId: number | null = null;
    if (labelId !== undefined && labelId !== null) {
      const parsedLabelId = parseInt(labelId);
      if (isNaN(parsedLabelId)) {
        return res.status(400).json({ error: 'Invalid labelId' });
      }
      const labelRepository = AppDataSource.getRepository(Label);
      const label = await labelRepository.findOne({ where: { id: parsedLabelId, chatId: chat.id } });
      if (!label) {
        return res.status(404).json({ error: 'Label not found for this chat' });
      }
      normalizedLabelId = label.id;
    }
    
    // Валидация deadline
    let deadlineDate: Date | null = null;
    if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ error: 'Invalid deadline format' });
      }
    }
    
    const taskRepository = AppDataSource.getRepository(Task);
    const task = taskRepository.create({
      title: title.trim(),
      description: description && typeof description === 'string' ? description.trim() : null,
      assignedTelegramId: assignedTelegramId ? (typeof assignedTelegramId === 'number' ? assignedTelegramId : parseInt(assignedTelegramId)) : null,
      assignedRoleId: assignedRoleId ? parseInt(assignedRoleId) : null,
      deadline: deadlineDate,
      status: (status as 'backlog' | 'in_progress' | 'completed') || 'backlog',
      labelId: normalizedLabelId,
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
      relations: ['assignedUser', 'assignedRole', 'chat', 'label'],
    });

    await taskHistoryService.logCreation(savedTask, telegramId);
    
    res.status(201).json(taskWithRelations);
  } catch (error: any) {
    console.error('Error creating task:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Task with this ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - обновить задачу
router.put('/:id', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    if (!telegramId) {
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const { title, description, assignedTelegramId, assignedRoleId, deadline, status, labelId } = req.body;
    
    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignedUser', 'assignedRole', 'chat', 'label'],
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const previousTaskState = Object.assign(new Task(), task);

    // Валидация и обновление title
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      task.title = title.trim();
    }
    
    // Валидация и обновление description
    if (description !== undefined) {
      task.description = description && typeof description === 'string' ? description.trim() : null;
    }
    
    // Валидация и обновление assignedTelegramId
    if (assignedTelegramId !== undefined) {
      if (assignedTelegramId === null) {
        task.assignedTelegramId = null;
      } else {
        const assignedTelegramIdNum = typeof assignedTelegramId === 'number' ? assignedTelegramId : parseInt(assignedTelegramId);
        if (isNaN(assignedTelegramIdNum)) {
          return res.status(400).json({ error: 'Invalid assignedTelegramId' });
        }
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { telegramId: assignedTelegramIdNum } });
        if (!user) {
          return res.status(404).json({ error: 'Assigned user not found' });
        }
        task.assignedTelegramId = assignedTelegramIdNum;
      }
    }
    
    // Валидация и обновление assignedRoleId
    if (assignedRoleId !== undefined) {
      if (assignedRoleId === null) {
        task.assignedRoleId = null;
      } else {
        const roleId = parseInt(assignedRoleId);
        if (isNaN(roleId)) {
          return res.status(400).json({ error: 'Invalid assignedRoleId' });
        }
        const roleRepository = AppDataSource.getRepository(Role);
        const role = await roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
          return res.status(404).json({ error: 'Assigned role not found' });
        }
        task.assignedRoleId = roleId;
      }
    }
    
    // Валидация и обновление deadline
    if (deadline !== undefined) {
      if (deadline === null) {
        task.deadline = null;
      } else {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
          return res.status(400).json({ error: 'Invalid deadline format' });
        }
        task.deadline = deadlineDate;
      }
    }
    
    // Валидация и обновление status
    if (status !== undefined) {
      const validStatuses = ['backlog', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      task.status = status as 'backlog' | 'in_progress' | 'completed';
    }

    if (labelId !== undefined) {
      if (labelId === null) {
        task.labelId = null;
      } else {
        const parsedLabelId = parseInt(labelId);
        if (isNaN(parsedLabelId)) {
          return res.status(400).json({ error: 'Invalid labelId' });
        }
        const labelRepository = AppDataSource.getRepository(Label);
        const label = await labelRepository.findOne({
          where: { id: parsedLabelId, chatId: task.chat?.id },
        });
        if (!label) {
          return res.status(404).json({ error: 'Label not found for this chat' });
        }
        task.labelId = label.id;
      }
    }
    
    const updatedTask = await taskRepo.save(task);
    
    // Загружаем с отношениями
    const taskWithRelations = await taskRepo.findOne({
      where: { id: updatedTask.id },
      relations: ['assignedUser', 'assignedRole', 'chat', 'label'],
    });

    // Получаем userId по telegramId
    const user = await AppDataSource.getRepository(User).findOne({ 
      where: { telegramId: telegramId } 
    }); 
    await taskHistoryService.logUpdates(previousTaskState, updatedTask, telegramId);
    
    res.json(taskWithRelations);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - изменить статус задачи
router.patch('/:id/status', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    if (!telegramId) {
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['backlog', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({ where: { id: taskId } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const previousTaskState = Object.assign(new Task(), task);

    task.status = status as 'backlog' | 'in_progress' | 'completed';
    const updatedTask = await taskRepo.save(task);

    // Получаем userId по telegramId
    const user = await AppDataSource.getRepository(User).findOne({ 
      where: { telegramId: telegramId } 
    });
    await taskHistoryService.logUpdates(previousTaskState, updatedTask, telegramId);
    
    const taskWithRelations = await taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignedUser', 'assignedRole', 'chat', 'label']
    });
    
    res.json(taskWithRelations);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/tasks/:id - удалить задачу
router.delete('/:id', async (req: Request, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({ where: { id: taskId } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Удаляем связь ChatTask, если она существует
    const chatTaskRepo = AppDataSource.getRepository(ChatTask);
    await chatTaskRepo.delete({ taskId: taskId });
    
    // Удаляем саму задачу
    await taskRepo.delete(taskId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export const taskRoutes: Router = router;