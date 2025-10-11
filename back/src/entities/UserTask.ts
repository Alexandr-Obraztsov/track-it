import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Task } from './Task';

@Entity('user_tasks')
export class UserTask {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'task_id', type: 'int' })
  taskId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  // Связи с основными сущностями
  @ManyToOne(() => User, user => user.userTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;
}
