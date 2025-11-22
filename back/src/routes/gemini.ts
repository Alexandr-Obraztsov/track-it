import { Router } from 'express';
import { geminiService } from '../services/geminiService';
import { taskManager } from '../services/task-service/task-service';
import { AppDataSource } from '../configs/database';
import { Chat } from '../entities/Chat';
import { Task } from '../entities/Task';
import { authenticateToken } from '../middleware/auth';
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
router.post('/extract', authenticateToken, upload.single('audioData'), async (req: any, res) => {
  try {
    const { text, chatId } = req.body;
    let audioData: Buffer | undefined;
    let audioMimeType: string | undefined;

    if (!chatId) {
      return res.status(400).json({ 
        error: 'chatId is required' 
      });
    }

    // Обрабатываем аудио файл если он есть
    if (req.file) {
      audioData = req.file.buffer;
      audioMimeType = req.file.mimetype;
    }

    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({
      where: { id: parseInt(chatId) },
      relations: ['userChatRoles', 'userChatRoles.user', 'chatRoles', 'chatRoles.role']
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Получаем существующие задачи для контекста
    let existingTasks: Task[] = [];
    try {
      existingTasks = await taskManager.getChatTasks(chat.id);
    } catch (error) {
      console.error('Error fetching existing tasks:', error);
    }

    // Создаем параметры для geminiService
    const params = { text, audioData, audioMimeType, chat, existingTasks };

    const geminiResult = await geminiService.extractTasks(params);
    
    // Сохраняем задачи в базу данных
    const savedTasks = await taskManager.saveTasks({
      geminiResult,
      chat
    });
    
    res.json(geminiResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract tasks' });
  }
});

export const geminiRoutes: Router = router;