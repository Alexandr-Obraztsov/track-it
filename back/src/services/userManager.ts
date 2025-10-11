import TelegramBot from 'node-telegram-bot-api';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';
import { Chat } from '../entities/Chat';
import { UserChatRole } from '../entities/UserChatRole';
import { ChatRole } from '../entities/ChatRole';
import { Role } from '../entities/Role';


export class UserManager {
  private userRepository = AppDataSource.getRepository(User);
  private chatRepository = AppDataSource.getRepository(Chat);
  private userChatRoleRepository = AppDataSource.getRepository(UserChatRole);
  private chatRoleRepository = AppDataSource.getRepository(ChatRole);
  private roleRepository = AppDataSource.getRepository(Role);

  /**
   * Получает или создает пользователя
   */
  async getOrCreateUser(from: TelegramBot.User): Promise<User> {
    try {
      let user = await this.userRepository.findOne({ where: { telegramId: from.id } });

      if (!user) {
        user = this.userRepository.create({
          telegramId: from.id,
          username: from.username || `user_${from.id}`,
          firstName: from.first_name || 'Unknown',
          lastName: from.last_name || undefined
        });

        user = await this.userRepository.save(user);
        console.log('✅ [USER_MANAGER] New user created:', {
          id: user.id,
          username: user.username,
          firstName: user.firstName
        });
      } else {
        // Обновляем информацию о пользователе, если она изменилась
        const needsUpdate = 
          user.username !== (from.username || `user_${from.id}`) ||
          user.firstName !== (from.first_name || 'Unknown') ||
          user.lastName !== (from.last_name || undefined);

        if (needsUpdate) {
          user.username = from.username || `user_${from.id}`;
          user.firstName = from.first_name || 'Unknown';
          user.lastName = from.last_name || undefined;
          
          user = await this.userRepository.save(user);
          console.log('✅ [USER_MANAGER] User updated:', {
            id: user.id,
            username: user.username
          });
        }
      }

      return user;

    } catch (error) {
      console.error('❌ [USER_MANAGER] Error getting/creating user:', error);
      throw error;
    }
  }

  /**
   * Получает или создает чат
   */
  async getOrCreateChat(chat: TelegramBot.Chat): Promise<Chat> {
    try {
      let dbChat = await this.chatRepository.findOne({ where: { id: chat.id } });

      if (!dbChat) {
        dbChat = this.chatRepository.create({
          id: chat.id,
          title: chat.title || `Chat ${chat.id}`,
          messageId: 0 // Пока не используем
        });

        dbChat = await this.chatRepository.save(dbChat);
        console.log('✅ [USER_MANAGER] New chat created:', {
          id: dbChat.id,
          title: dbChat.title
        });
      } else {
        // Обновляем название чата, если оно изменилось
        if (dbChat.title !== (chat.title || `Chat ${chat.id}`)) {
          dbChat.title = chat.title || `Chat ${chat.id}`;
          dbChat = await this.chatRepository.save(dbChat);
          console.log('✅ [USER_MANAGER] Chat title updated:', {
            id: dbChat.id,
            title: dbChat.title
          });
        }
      }

      return dbChat;

    } catch (error) {
      console.error('❌ [USER_MANAGER] Error getting/creating chat:', error);
      throw error;
    }
  }

  /**
   * Получает пользователя по ID
   */
  async getUserById(userId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userChatRoles', 'userTasks']
    });
  }

  /**
   * Получает чат по ID
   */
  async getChatById(chatId: number): Promise<Chat | null> {
    return await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['userChatRoles', 'chatRoles', 'tasks']
    });
  }

  /**
   * Получает всех пользователей чата
   */
  async getChatUsers(chatId: number): Promise<User[]> {
    const userChatRoles = await this.userChatRoleRepository.find({
      where: { chatId },
      relations: ['user']
    });

    return userChatRoles.map(ucr => ucr.user);
  }

  /**
   * Добавляет пользователя в чат с ролью
   */
  async addUserToChat(
    userId: number,
    chatId: number,
    roleId: number
  ): Promise<UserChatRole | null> {
    try {
      // Проверяем, что пользователь и чат существуют
      const user = await this.getUserById(userId);
      const chat = await this.getChatById(chatId);
      const role = await this.roleRepository.findOne({ where: { id: roleId } });

      if (!user || !chat || !role) {
        console.warn('⚠️ [USER_MANAGER] User, chat or role not found:', {
          userId, chatId, roleId
        });
        return null;
      }

      // Проверяем, что роль доступна в чате
      const chatRole = await this.chatRoleRepository.findOne({
        where: { chatId, roleId }
      });

      if (!chatRole) {
        console.warn('⚠️ [USER_MANAGER] Role not available in chat:', {
          chatId, roleId
        });
        return null;
      }

      // Проверяем, что пользователь еще не имеет этой роли в чате
      const existingUserChatRole = await this.userChatRoleRepository.findOne({
        where: { userId, chatId, roleId }
      });

      if (existingUserChatRole) {
        console.warn('⚠️ [USER_MANAGER] User already has this role in chat:', {
          userId, chatId, roleId
        });
        return existingUserChatRole;
      }

      // Создаем новую связь пользователь-чат-роль
      const userChatRole = this.userChatRoleRepository.create({
        userId,
        chatId,
        roleId
      });

      const savedUserChatRole = await this.userChatRoleRepository.save(userChatRole);
      
      console.log('✅ [USER_MANAGER] User added to chat with role:', {
        userId, chatId, roleId
      });

      return savedUserChatRole;

    } catch (error) {
      console.error('❌ [USER_MANAGER] Error adding user to chat:', error);
      return null;
    }
  }

  /**
   * Удаляет пользователя из чата
   */
  async removeUserFromChat(userId: number, chatId: number): Promise<boolean> {
    try {
      const result = await this.userChatRoleRepository.delete({
        userId,
        chatId
      });

      const success = result.affected !== undefined && result.affected !== null && result.affected > 0;
      
      if (success) {
        console.log('✅ [USER_MANAGER] User removed from chat:', {
          userId, chatId
        });
      }

      return success;

    } catch (error) {
      console.error('❌ [USER_MANAGER] Error removing user from chat:', error);
      return false;
    }
  }

  /**
   * Получает роли пользователя в чате
   */
  async getUserChatRoles(userId: number, chatId: number): Promise<Role[]> {
    const userChatRoles = await this.userChatRoleRepository.find({
      where: { userId, chatId },
      relations: ['role']
    });

    return userChatRoles.map(ucr => ucr.role);
  }

  /**
   * Получает доступные роли в чате
   */
  async getChatRoles(chatId: number): Promise<Role[]> {
    const chatRoles = await this.chatRoleRepository.find({
      where: { chatId },
      relations: ['role']
    });

    return chatRoles.map(cr => cr.role);
  }

  /**
   * Добавляет роль в чат
   */
  async addRoleToChat(chatId: number, roleId: number): Promise<ChatRole | null> {
    try {
      // Проверяем, что чат и роль существуют
      const chat = await this.getChatById(chatId);
      const role = await this.roleRepository.findOne({ where: { id: roleId } });

      if (!chat || !role) {
        console.warn('⚠️ [USER_MANAGER] Chat or role not found:', {
          chatId, roleId
        });
        return null;
      }

      // Проверяем, что роль еще не добавлена в чат
      const existingChatRole = await this.chatRoleRepository.findOne({
        where: { chatId, roleId }
      });

      if (existingChatRole) {
        console.warn('⚠️ [USER_MANAGER] Role already exists in chat:', {
          chatId, roleId
        });
        return existingChatRole;
      }

      // Создаем новую связь чат-роль
      const chatRole = this.chatRoleRepository.create({
        chatId,
        roleId
      });

      const savedChatRole = await this.chatRoleRepository.save(chatRole);
      
      console.log('✅ [USER_MANAGER] Role added to chat:', {
        chatId, roleId
      });

      return savedChatRole;

    } catch (error) {
      console.error('❌ [USER_MANAGER] Error adding role to chat:', error);
      return null;
    }
  }
}

export const userManager = new UserManager();
