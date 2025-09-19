import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ChatEntity } from './Chat'
import { UserEntity } from './User'
import { RoleEntity } from './Role'

// Сущность задачи
@Entity('tasks')
export class TaskEntity {
	@PrimaryGeneratedColumn()
	id!: number

	@Column({ type: 'varchar' })
	title!: string // Название задачи

	@Column({ type: 'text' })
	description!: string // Описание задачи

	@Column({ type: 'varchar' })
	readableId!: string // Читаемый ID задачи (например: CHT-123 или PSN-456)

	@Column({ type: 'integer' })
	localId!: number // Локальный ID задачи в рамках чата или пользователя (начинается с 1)

	@Column({
		type: 'enum',
		enum: ['high', 'medium', 'low'],
		default: 'medium',
	})
	priority!: 'high' | 'medium' | 'low' // Приоритет задачи

	@Column({ type: 'timestamp', nullable: true })
	deadline?: Date // Срок выполнения с датой и временем

	@Column({ type: 'boolean', default: false })
	isCompleted!: boolean // Статус выполнения

	@Column({
		type: 'enum',
		enum: ['personal', 'group'],
		default: 'personal',
	})
	type!: 'personal' | 'group' // Тип задачи

	@Column({ type: 'bigint' })
	authorId!: string // ID автора задачи

	@Column({ type: 'bigint', nullable: true })
	chatId?: string // ID чата для групповых задач

	@Column({ type: 'bigint', nullable: true })
	assignedUserId?: string // ID назначенного пользователя

	@Column({ type: 'integer', nullable: true })
	assignedRoleId?: number // ID назначенной роли

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date // Дата создания

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt!: Date // Дата последнего обновления

	// Автор задачи
	@ManyToOne(() => UserEntity, user => user.createdTasks, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'authorId' })
	author!: UserEntity

	// Чат для групповых задач
	@ManyToOne(() => ChatEntity, chat => chat.tasks, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'chatId' })
	chat?: ChatEntity

	// Назначенный пользователь
	@ManyToOne(() => UserEntity, user => user.assignedTasks, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'assignedUserId' })
	assignedUser?: UserEntity

	// Назначенная роль
	@ManyToOne(() => RoleEntity, role => role.assignedTasks, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'assignedRoleId' })
	assignedRole?: RoleEntity
}
