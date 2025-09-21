import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { TaskEntity } from './Task'
import { ChatMemberEntity } from './ChatMember'
import { NotificationPresetType, DEFAULT_NOTIFICATION_PRESETS } from '../configs/notificationPresets'

// Сущность пользователя Telegram
@Entity('users')
export class UserEntity {
	@PrimaryColumn({ type: 'bigint' })
	telegramId!: string // ID пользователя в Telegram как первичный ключ

	@Column({ type: 'varchar' })
	username!: string // Username пользователя

	@Column({ type: 'varchar' })
	firstName!: string // Имя пользователя

	@Column({ type: 'varchar', nullable: true })
	lastName?: string // Фамилия пользователя

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date // Дата регистрации

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt!: Date // Дата последнего обновления

	// Настройки уведомлений
	@Column({ 
		type: 'enum',
		enum: ['off', 'minimal', 'standard', 'frequent', 'maximum'],
		default: DEFAULT_NOTIFICATION_PRESETS.personal
	})
	personalNotificationPreset!: NotificationPresetType // Пресет для личных задач

	@Column({ 
		type: 'enum',
		enum: ['off', 'minimal', 'standard', 'frequent', 'maximum'],
		default: DEFAULT_NOTIFICATION_PRESETS.group
	})
	groupNotificationPreset!: NotificationPresetType // Пресет для групповых задач

	@OneToMany(() => TaskEntity, task => task.author)
	createdTasks?: TaskEntity[] // Задачи, созданные пользователем

	@OneToMany(() => TaskEntity, task => task.assignedUser)
	assignedTasks?: TaskEntity[] // Задачи, назначенные пользователю

	@OneToMany(() => ChatMemberEntity, membership => membership.user)
	chatMemberships?: ChatMemberEntity[] // Участие в чатах
}
