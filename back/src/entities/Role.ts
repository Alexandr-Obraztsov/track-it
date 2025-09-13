import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { ChatEntity } from './Chat'
import { ChatMemberEntity } from './ChatMember'

// Сущность роли для хранения в базе данных
@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'varchar' })
    name!: string // Название роли

    @Column({ type: 'varchar' })
    chatId!: string // ID беседы (ссылается на chatId из таблицы chats)

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date // Дата создания роли

    @ManyToOne(() => ChatEntity)
    @JoinColumn({ name: 'chatId', referencedColumnName: 'chatId' })
    chat?: ChatEntity

    @OneToMany(() => ChatMemberEntity, member => member.role)
    members?: ChatMemberEntity[] // Участники с этой ролью
}