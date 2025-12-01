import { Router, Request } from 'express';
import { AppDataSource } from '../configs/database';
import { TaskComment } from '../entities/TaskComment';
import { Task } from '../entities/Task';
import { getTelegramId } from '../utils/getTelegramId';
import { TelegramAuthRequest } from '../middleware/telegramAuth';

const router = Router();

// GET /api/comments/task/:taskId - получить все комментарии к задаче
router.get('/task/:taskId', async (req: Request, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const comments = await AppDataSource.getRepository(TaskComment).find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/comments - создать новый комментарий
router.post('/', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    if (!telegramId) {
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const { taskId, content } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required and cannot be empty' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ error: 'content is too long (max 10000 characters)' });
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({ where: { id: parseInt(taskId) } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const commentRepository = AppDataSource.getRepository(TaskComment);
    const comment = commentRepository.create({
      taskId: parseInt(taskId),
      telegramId,
      content: content.trim(),
    });

    const saved = await commentRepository.save(comment);
    const commentWithUser = await commentRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PUT /api/comments/:id - обновить комментарий
router.put('/:id', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment id' });
    }

    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required and cannot be empty' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ error: 'content is too long (max 10000 characters)' });
    }

    const commentRepository = AppDataSource.getRepository(TaskComment);
    const comment = await commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Проверяем, что пользователь может редактировать только свои комментарии
    if (comment.user.telegramId !== telegramId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    comment.content = content.trim();
    comment.edited = true;
    comment.editedAt = new Date();

    const updated = await commentRepository.save(comment);
    res.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE /api/comments/:id - удалить комментарий
router.delete('/:id', async (req: Request, res) => {
  try {

    const telegramId = getTelegramId(req);

    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment id' });
    }

    const commentRepository = AppDataSource.getRepository(TaskComment);
    const comment = await commentRepository.findOne({ where: { id: commentId } });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Проверяем, что пользователь может удалять только свои комментарии
    if (comment.telegramId !== telegramId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await commentRepository.delete(commentId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export const commentRoutes: Router = router;

