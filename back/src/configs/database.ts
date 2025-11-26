import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Chat } from '../entities/Chat';
import { Role } from '../entities/Role';
import { Task } from '../entities/Task';
import { UserChatRole } from '../entities/UserChatRole';
import { ChatRole } from '../entities/ChatRole';
import { UserTask } from '../entities/UserTask';
import { ChatTask } from '../entities/ChatTask';
import { NotificationSettings } from '../entities/NotificationSettings';
import { TaskHistory } from '../entities/TaskHistory';
import { Label } from '../entities/Label';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'track_it',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Chat, Role, Task, UserChatRole, ChatRole, UserTask, ChatTask, NotificationSettings, TaskHistory, Label],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established successfully');
      
      // Синхронизируем схему, если не в production
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Synchronizing database schema...');
        await AppDataSource.synchronize(false); // false = не удаляет существующие таблицы
        console.log('✅ Database schema synchronized successfully');
      }
    }
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  }
};
