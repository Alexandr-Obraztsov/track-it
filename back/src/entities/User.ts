import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserChatRole } from './UserChatRole';
import { UserTask } from './UserTask';
import { TaskComment } from './TaskComment';

@Entity('users')
export class User {
  @PrimaryColumn({ name: 'telegram_id', type: 'bigint' })
  telegramId!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Связь один-ко-многим с UserChatRole
  @OneToMany(() => UserChatRole, userChatRole => userChatRole.user)
  userChatRoles!: UserChatRole[];

  // Связь один-ко-многим с UserTask (личные задачи пользователя)
  @OneToMany(() => UserTask, userTask => userTask.user)
  userTasks!: UserTask[];

  // Связь один-ко-многим с TaskComment (комментарии пользователя)
  @OneToMany(() => TaskComment, comment => comment.user)
  taskComments!: TaskComment[];
}