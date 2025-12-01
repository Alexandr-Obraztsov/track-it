import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

async function dropDatabase() {
  // Создаем DataSource без синхронизации специально для удаления
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'track_it',
    synchronize: false, // Отключаем синхронизацию
    logging: false,
  });

  try {
    console.log('🔄 Инициализация подключения к базе данных...');
    await dataSource.initialize();
    
    const queryRunner = dataSource.createQueryRunner();
    
    console.log('🗑️  Удаление всех таблиц...');
    
    // Читаем SQL скрипт
    const sqlPath = path.join(__dirname, '../../drop_all_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Выполняем весь SQL скрипт целиком
    await queryRunner.query(sql);
    
    console.log('✅ Все таблицы успешно удалены!');
    
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при удалении таблиц:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

dropDatabase();

