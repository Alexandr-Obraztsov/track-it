import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Task } from './Task';
import { User } from './User';

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'task_id', type: 'int' })
  taskId!: number;

  @ManyToOne(() => Task, (task) => task.historyEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ name: 'changed_by_user_id', type: 'int', nullable: true })
  changedByUserId!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser!: User | null;

  @Column({ type: 'varchar', length: 64 })
  field!: string;

  @Column({ type: 'text', nullable: true })
  oldValue!: string | null;

  @Column({ type: 'text', nullable: true })
  newValue!: string | null;

  @Column({ type: 'varchar', length: 32 })
  changeType!: 'create' | 'update';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

