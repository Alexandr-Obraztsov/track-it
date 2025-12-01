import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { Label } from '../entities/Label';
import { Chat } from '../entities/Chat';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const normalizeColor = (color?: string | null): string | null => {
  if (!color) {
    return null;
  }
  const trimmed = color.trim();
  const hexRegex = /^#([0-9a-fA-F]{6})$/;
  if (!hexRegex.test(trimmed)) {
    throw new Error('Color must be in HEX format, e.g. #3366FF');
  }
  return trimmed.toLowerCase();
};

router.get('/chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }

    const labels = await AppDataSource.getRepository(Label).find({
      where: { chatId },
      order: { name: 'ASC' },
    });

    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chatId, name, color } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const chatIdNum = parseInt(chatId);
    if (isNaN(chatIdNum)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }

    const chatRepository = AppDataSource.getRepository(Chat);
    const chat = await chatRepository.findOne({ where: { id: chatIdNum } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    let normalizedColor: string | null = null;
    try {
      normalizedColor = normalizeColor(color);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const labelRepository = AppDataSource.getRepository(Label);
    const label = labelRepository.create({
      chatId: chatIdNum,
      name: name.trim(),
      color: normalizedColor,
    });

    const saved = await labelRepository.save(label);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const labelId = parseInt(req.params.id);
    if (isNaN(labelId)) {
      return res.status(400).json({ error: 'Invalid label id' });
    }

    const { name, color } = req.body;

    const labelRepository = AppDataSource.getRepository(Label);
    const label = await labelRepository.findOne({ where: { id: labelId } });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    if (name !== undefined) {
      if (name === null || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'name must be a non-empty string' });
      }
      label.name = name.trim();
    }

    if (color !== undefined) {
      try {
        label.color = normalizeColor(color);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }

    const updated = await labelRepository.save(label);
    res.json(updated);
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const labelId = parseInt(req.params.id);
    if (isNaN(labelId)) {
      return res.status(400).json({ error: 'Invalid label id' });
    }

    const labelRepository = AppDataSource.getRepository(Label);
    const existing = await labelRepository.findOne({ where: { id: labelId } });
    if (!existing) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Перед удалением метки устанавливаем labelId в null для всех задач с этой меткой
    const { Task } = await import('../entities/Task');
    const taskRepository = AppDataSource.getRepository(Task);
    await taskRepository.update(
      { labelId },
      { labelId: null }
    );

    await labelRepository.delete(labelId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

export const labelRoutes: Router = router;



