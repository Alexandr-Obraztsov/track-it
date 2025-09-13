import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// Сущность задачи для хранения в базе данных
@Entity('tasks')
export class TaskEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string // Название задачи

    @Column()
    description: string // Описание задачи

    @Column({
        type: 'enum',
        enum: ['high', 'medium', 'low'],
    })
    priority: 'high' | 'medium' | 'low' // Приоритет задачи

    @Column({ nullable: true })
    deadline: string | null // Срок выполнения (в формате YYYY-MM-DD)

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date // Дата создания задачи

    @Column({ type: 'int', nullable: true })
    userId: number | null // ID пользователя Telegram
}