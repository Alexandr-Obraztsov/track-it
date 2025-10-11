import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserChatRole } from './UserChatRole';
import { ChatRole } from './ChatRole';
import { Task } from './Task';
import { ChatTask } from './ChatTask';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'int' })
  messageId!: number;

  // Связь один-ко-многим с UserChatRole (назначенные роли пользователям)
  @OneToMany(() => UserChatRole, userChatRole => userChatRole.chat)
  userChatRoles!: UserChatRole[];

  // Связь один-ко-многим с ChatRole (доступные роли в чате)
  @OneToMany(() => ChatRole, chatRole => chatRole.chat)
  chatRoles!: ChatRole[];

  // Связь один-ко-многим с Task (задачи чата)
  @OneToMany(() => Task, task => task.chat)
  tasks!: Task[];

  // Связь один-ко-многим с ChatTask (промежуточная таблица)
  @OneToMany(() => ChatTask, chatTask => chatTask.chat)
  chatTasks!: ChatTask[];
}