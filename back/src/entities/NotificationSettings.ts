import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('notification_settings')
export class NotificationSettings {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'user_id', type: 'bigint', unique: true })
  telegramId!: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'daily_digest_time', type: 'varchar', length: 5, default: '09:00' })
  dailyDigestTime!: string; // Формат "HH:mm"

  @Column({ name: 'deadline_reminder_hours', type: 'integer', array: true, nullable: true })
  deadlineReminderHours!: number[]; // Массив часов

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

