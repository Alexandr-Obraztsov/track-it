import { Router } from 'express';
import { geminiService } from '../services/geminiService';
import { taskManager } from '../services/task-service/task-service';
import { AppDataSource } from '../configs/database';
import { Chat } from '../entities/Chat';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import multer from 'multer';

const router = Router();

// Настройка multer для обработки файлов в памяти
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB лимит
  }
});

// POST /api/gemini/extract - извлечение задач из текста или аудио
router.post('/extract', upload.single('audioData'), async (req, res) => {
  try {
    const { text, chatId, userId, type } = req.body;
    let audioData: Buffer | undefined;
    let audioMimeType: string | undefined;

    // Обрабатываем аудио файл если он есть
    if (req.file) {
      audioData = req.file.buffer;
      audioMimeType = req.file.mimetype;
    }

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
      ? { text, audioData, audioMimeType, chat: chat!, existingTasks, isPersonal: false as const }
      : { text, audioData, audioMimeType, user: user!, existingTasks, isPersonal: true as const };

    const result = await geminiService.extractTasks(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract tasks' });
  }
});

export const geminiRoutes: Router = router;