import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserChatRole } from './UserChatRole';
import { ChatRole } from './ChatRole';
import { Task } from './Task';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Связь один-ко-многим с UserChatRole (назначенные роли пользователям)
  @OneToMany(() => UserChatRole, userChatRole => userChatRole.role)
  userChatRoles!: UserChatRole[];

  // Связь один-ко-многим с ChatRole (роли, доступные в чатах)
  @OneToMany(() => ChatRole, chatRole => chatRole.role)
  chatRoles!: ChatRole[];

  // Связь один-ко-многим с Task (назначенные задачи)
  @OneToMany(() => Task, task => task.assignedRole)
  assignedTasks!: Task[];
}