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
      relations: ['users', 'roles']
    });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// GET /api/chats/:id - получить чат по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['users', 'roles']
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
router.post('/', async (req, res) => {
  try {
    const { title, messageId } = req.body;
    
    if (!title || messageId === undefined) {
      return res.status(400).json({ error: 'Title and messageId are required' });
    }

    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = chatRepository.create({
      title,
      messageId: parseInt(messageId)
    });

    const savedChat = await chatRepository.save(chat);
    res.status(201).json(savedChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// PUT /api/chats/:id - обновить чат
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, messageId } = req.body;
    
    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.title = title || chat.title;
    chat.messageId = messageId !== undefined ? parseInt(messageId) : chat.messageId;

    const updatedChat = await chatRepository.save(chat);
    res.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// DELETE /api/chats/:id - удалить чат
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chatRepository = AppDataSource.getRepository(Chat);
    const result = await chatRepository.delete(parseInt(id));

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
