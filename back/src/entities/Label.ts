import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Chat } from './Chat';
import { Task } from './Task';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'chat_id', type: 'bigint' })
  chatId!: number;

  @ManyToOne(() => Chat, (chat) => chat.labels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Task, (task) => task.label)
  tasks!: Task[];
}

