import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Chat } from './Chat';
import { User } from './User';
import { Role } from './Role';
import { UserTask } from './UserTask';
import { ChatTask } from './ChatTask';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ name: 'assigned_role_id', type: 'int', nullable: true })
  assignedRoleId!: number | null;

  @Column({ name: 'assigned_user_id', type: 'int', nullable: true })
  assignedUserId!: number | null;

  @Column({ type: 'date', nullable: true })
  deadline!: Date | null;

  // Связи с основными сущностями
  @ManyToOne(() => Chat, chat => chat.tasks, { nullable: true })
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat | null;

  // Для групповых задач - назначение на конкретного пользователя
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser!: User | null;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'assigned_role_id' })
  assignedRole!: Role | null;

  // Связь один-ко-многим с UserTask (для личных задач)
  @OneToMany(() => UserTask, userTask => userTask.task)
  userTasks!: UserTask[];

  // Связь один-ко-многим с ChatTask (промежуточная таблица)
  @OneToMany(() => ChatTask, chatTask => chatTask.task)
  chatTasks!: ChatTask[];
}