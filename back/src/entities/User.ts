import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserChatRole } from './UserChatRole';
import { UserTask } from './UserTask';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'telegram_id', type: 'bigint', unique: true })
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
}