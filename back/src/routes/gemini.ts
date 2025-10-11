import { Router } from 'express';
import { geminiService } from '../services/geminiService';
import { taskManager } from '../services/task-service/task-service';
import { AppDataSource } from '../configs/database';
import { Chat } from '../entities/Chat';
import { User } from '../entities/User';
import { Task } from '../entities/Task';

const router = Router();

// POST /api/gemini/extract - извлечение задач из текста или аудио
router.post('/extract', async (req, res) => {
  try {
    const { text, audioData, chatId, userId, type } = req.body;

    let chat: Chat | null = null;
    let user: User | null = null;

    if (type === 'group' && chatId) {
      const chatRepository = AppDataSource.getRepository(Chat);
      chat = await chatRepository.findOne({
        where: { id: parseInt(chatId) },
        relations: ['userChatRoles', 'userChatRoles.user', 'chatRoles', 'chatRoles.role']
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
    } else if (type === 'personal' && userId) {
      const userRepository = AppDataSource.getRepository(User);
      user = await userRepository.findOne({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      return res.status(400).json({ 
        error: 'Invalid parameters. For group tasks: type=group, chatId required. For personal tasks: type=personal, userId required.' 
      });
    }

    // Получаем существующие задачи для контекста
    let existingTasks: Task[] = [];
    try {
      if (type === 'group' && chat) {
        existingTasks = await taskManager.getChatTasks(chat.id);
      } else if (type === 'personal' && user) {
        existingTasks = await taskManager.getUserPersonalTasks(user.id);
      }
    } catch (error) {
      console.error('Error fetching existing tasks:', error);
    }

    // Создаем параметры для geminiService
    const params = type === 'group'
      ? { text, audioData, chat: chat!, existingTasks, isPersonal: false as const }
      : { text, audioData, user: user!, existingTasks, isPersonal: true as const };

    const result = await geminiService.extractTasks(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract tasks' });
  }
});

export const geminiRoutes: Router = router;