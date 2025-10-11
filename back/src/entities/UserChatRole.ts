import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Chat } from './Chat';
import { Role } from './Role';

@Entity('user_chat_roles')
export class UserChatRole {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'chat_id', type: 'int' })
  chatId!: number;

  @Column({ name: 'role_id', type: 'int' })
  roleId!: number;

  // Связи с основными сущностями
  @ManyToOne(() => User, user => user.userChatRoles)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Chat, chat => chat.userChatRoles)
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => Role, role => role.userChatRoles)
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}