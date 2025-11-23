import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { Chat } from '../entities/Chat';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/chats - получить все чаты
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chatRepository = AppDataSource.getRepository(Chat);
    const chats = await chatRepository.find({
      relations: [
        'userChatRoles',
        'userChatRoles.user',
        'userChatRoles.role',
        'chatRoles',
        'chatRoles.role',
        'tasks',
        'tasks.assignedUser',
        'tasks.assignedRole'
      ]
    });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// GET /api/chats/:id - получить чат по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const chatId = parseInt(id);
    
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }

    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({
      where: { id: chatId },
      relations: [
        'userChatRoles',
        'userChatRoles.user',
        'userChatRoles.role',
        'chatRoles',
        'chatRoles.role',
        'tasks',
        'tasks.assignedUser',
        'tasks.assignedRole'
      ]
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// POST /api/chats - создать новый чат
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, messageId, id } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }

    if (messageId === undefined && id === undefined) {
      return res.status(400).json({ error: 'messageId or id is required' });
    }

    const chatId = id ? parseInt(id) : undefined;
    const messageIdNum = messageId !== undefined ? parseInt(messageId) : undefined;

    if (chatId && isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat id' });
    }

    if (messageIdNum !== undefined && isNaN(messageIdNum)) {
      return res.status(400).json({ error: 'Invalid messageId' });
    }

    const chatRepository = AppDataSource.getRepository(Chat);
    
    // Если передан id, используем его как primary key
    const chat = chatRepository.create({
      ...(chatId && { id: chatId }),
      title: title.trim(),
      messageId: messageIdNum || 0
    });

    const savedChat = await chatRepository.save(chat);
    res.status(201).json(savedChat);
  } catch (error: any) {
    console.error('Error creating chat:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Chat with this ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// PUT /api/chats/:id - обновить чат
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const chatId = parseInt(id);
    
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }

    const { title, messageId } = req.body;
    
    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({
      where: { id: chatId }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      chat.title = title.trim();
    }

    if (messageId !== undefined) {
      const messageIdNum = parseInt(messageId);
      if (isNaN(messageIdNum)) {
        return res.status(400).json({ error: 'Invalid messageId' });
      }
      chat.messageId = messageIdNum;
    }

    const updatedChat = await chatRepository.save(chat);
    res.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// DELETE /api/chats/:id - удалить чат
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const chatId = parseInt(id);
    
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }

    const chatRepository = AppDataSource.getRepository(Chat);
    const result = await chatRepository.delete(chatId);

    if (result.affected === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export const chatRoutes: Router = router;
