import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Chat } from './Chat';
import { Role } from './Role';

@Entity('chat_roles')
export class ChatRole {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'chat_id', type: 'int' })
  chatId!: number;

  @Column({ name: 'role_id', type: 'int' })
  roleId!: number;

  // Связи с основными сущностями
  @ManyToOne(() => Chat, chat => chat.chatRoles)
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => Role, role => role.chatRoles)
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}