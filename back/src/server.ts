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
import { notificationRoutes } from './routes/notifications';
import { TelegramBotService } from './bot/telegramBot';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
// Настраиваем CORS - разрешаем все origins
app.use(cors({
  origin: true, // Разрешаем все origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
}));

// Настраиваем Helmet с учетом Telegram Mini App
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
      connectSrc: ["'self'", "https://telegram.org", "https://api.telegram.org"],
    },
  },
}));
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
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
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
