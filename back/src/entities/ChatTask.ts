import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Chat } from './Chat';
import { Task } from './Task';

@Entity('chat_tasks')
export class ChatTask {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'chat_id', type: 'int' })
  chatId!: number;

  @Column({ name: 'task_id', type: 'int' })
  taskId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  // Связи с основными сущностями
  @ManyToOne(() => Chat, chat => chat.chatTasks)
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => Task, task => task.chatTasks)
  @JoinColumn({ name: 'task_id' })
  task!: Task;
}
