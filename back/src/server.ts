import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './configs/database';
import { userRoutes } from './routes/users';
import { chatRoutes } from './routes/chats';
import { roleRoutes } from './routes/roles';
import { taskRoutes } from './routes/tasks';
import { geminiRoutes } from './routes/gemini';
import authRoutes from './routes/auth';
import { TelegramBotService } from './bot/telegramBot';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/gemini', geminiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Запускаем Telegram бота
  try {
    const telegramBot = new TelegramBotService();
    telegramBot.start();
  } catch (error) {
    console.error('Failed to start Telegram bot:', error);
  }
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
