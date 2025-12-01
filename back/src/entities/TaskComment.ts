import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './Task';
import { User } from './User';

@Entity('task_comments')
export class TaskComment {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'task_id', type: 'int' })
  taskId!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  edited!: boolean;

  @Column({ name: 'edited_at', type: 'timestamp with time zone', nullable: true })
  editedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Связи
  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

