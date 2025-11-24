import { AppDataSource } from '../configs/database';

async function syncSchema() {
  try {
    console.log('🔄 Инициализация подключения к базе данных...');
    await AppDataSource.initialize();
    
    console.log('🔄 Синхронизация схемы базы данных...');
    await AppDataSource.synchronize(true);
    
    console.log('✅ Схема базы данных успешно синхронизирована!');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при синхронизации схемы:', error);
    process.exit(1);
  }
}

syncSchema();



