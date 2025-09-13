import 'dotenv/config'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { TaskEntity } from './src/entities/Task'
import { ChatEntity } from './src/entities/Chat'
import { ChatMemberEntity } from './src/entities/ChatMember'

// Проверка типов данных в базе данных
async function checkDatabaseSchema() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'trackit',
        entities: [TaskEntity, ChatEntity, ChatMemberEntity],
        synchronize: false, // Не синхронизируем, только проверяем
    })

    try {
        await dataSource.initialize()
        console.log('✅ Подключение к базе данных успешно')

        // Получаем информацию о таблицах
        const queryRunner = dataSource.createQueryRunner()

        // Проверяем таблицу chat_members
        const chatMembersTable = await queryRunner.getTable('chat_members')
        if (chatMembersTable) {
            console.log('\n📋 Структура таблицы chat_members:')
            chatMembersTable.columns.forEach(column => {
                console.log(`  ${column.name}: ${column.type} (${column.isNullable ? 'nullable' : 'not null'})`)
            })
        }

        // Проверяем таблицу chats
        const chatsTable = await queryRunner.getTable('chats')
        if (chatsTable) {
            console.log('\n📋 Структура таблицы chats:')
            chatsTable.columns.forEach(column => {
                console.log(`  ${column.name}: ${column.type} (${column.isNullable ? 'nullable' : 'not null'})`)
            })
        }

        // Проверяем таблицу tasks
        const tasksTable = await queryRunner.getTable('tasks')
        if (tasksTable) {
            console.log('\n📋 Структура таблицы tasks:')
            tasksTable.columns.forEach(column => {
                console.log(`  ${column.name}: ${column.type} (${column.isNullable ? 'nullable' : 'not null'})`)
            })
        }

        await queryRunner.release()
        await dataSource.destroy()

    } catch (error) {
        console.error('❌ Ошибка подключения к базе данных:', error)
    }
}

checkDatabaseSchema()