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
   * @returns объект с пользователем и флагом isNewUser
   */
  async getOrCreateUser(from: TelegramBot.User): Promise<{ user: User; isNewUser: boolean }> {
    try {
      let user = await this.userRepository.findOne({ where: { telegramId: from.id } });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = this.userRepository.create({
          telegramId: from.id,
          username: from.username || undefined,
          firstName: from.first_name || 'Unknown',
          lastName: from.last_name || undefined,
          photoUrl: undefined // photoUrl из Telegram User недоступен напрямую, только через WebApp
        });

        user = await this.userRepository.save(user);
      } else {
        // Обновляем информацию о пользователе, если она изменилась
        const newUsername = from.username || undefined;
        const newFirstName = from.first_name || 'Unknown';
        const newLastName = from.last_name || undefined;

        const needsUpdate = 
          user.username !== newUsername ||
          user.firstName !== newFirstName ||
          user.lastName !== newLastName;

        if (needsUpdate) {
          user.username = newUsername;
          user.firstName = newFirstName;
          user.lastName = newLastName;
          // photoUrl обновляется только через WebApp auth, не через Telegram Bot API
          
          user = await this.userRepository.save(user);
        }
      }

      return { user, isNewUser };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Получает или создает чат
   */
  async getOrCreateChat(chat: TelegramBot.Chat, messageId?: number): Promise<Chat> {
    try {
      let dbChat = await this.chatRepository.findOne({ where: { id: chat.id } });

      if (!dbChat) {
        dbChat = this.chatRepository.create({
          id: chat.id,
          title: chat.title || chat.first_name || `Chat ${chat.id}`,
          messageId: messageId || 0
        });

        dbChat = await this.chatRepository.save(dbChat);
      } else {
        // Обновляем название чата и messageId, если они изменились
        const newTitle = chat.title || chat.first_name || `Chat ${chat.id}`;
        const needsUpdate = dbChat.title !== newTitle || (messageId && dbChat.messageId !== messageId);

        if (needsUpdate) {
          dbChat.title = newTitle;
          if (messageId) {
            dbChat.messageId = messageId;
          }
          dbChat = await this.chatRepository.save(dbChat);
        }
      }

      return dbChat;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Получает пользователя по telegramId
   */
  async getUserById(telegramId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { telegramId },
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
        return null;
      }

      // Проверяем, что роль доступна в чате
      const chatRole = await this.chatRoleRepository.findOne({
        where: { chatId, roleId }
      });

      if (!chatRole) {
        return null;
      }

      // Проверяем, что пользователь еще не имеет этой роли в чате
      const existingUserChatRole = await this.userChatRoleRepository.findOne({
        where: { telegramId: userId, chatId, roleId }
      });

      if (existingUserChatRole) {
        return existingUserChatRole;
      }

      // Создаем новую связь пользователь-чат-роль
      const userChatRole = this.userChatRoleRepository.create({
        telegramId: userId,
        chatId,
        roleId
      });

      const savedUserChatRole = await this.userChatRoleRepository.save(userChatRole);
      return savedUserChatRole;

    } catch (error) {
      return null;
    }
  }

  /**
   * Удаляет пользователя из чата
   */
  async removeUserFromChat(userId: number, chatId: number): Promise<boolean> {
    try {
      const result = await this.userChatRoleRepository.delete({
        telegramId: userId,
        chatId
      });

      return result.affected !== undefined && result.affected !== null && result.affected > 0;

    } catch (error) {
      return false;
    }
  }

  /**
   * Получает роли пользователя в чате
   */
  async getUserChatRoles(userId: number, chatId: number): Promise<Role[]> {
    const userChatRoles = await this.userChatRoleRepository.find({
      where: { telegramId: userId, chatId },
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
        return null;
      }

      // Проверяем, что роль еще не добавлена в чат
      const existingChatRole = await this.chatRoleRepository.findOne({
        where: { chatId, roleId }
      });

      if (existingChatRole) {
        return existingChatRole;
      }

      // Создаем новую связь чат-роль
      const chatRole = this.chatRoleRepository.create({
        chatId,
        roleId
      });

      return await this.chatRoleRepository.save(chatRole);

    } catch (error) {
      return null;
    }
  }
}

export const userManager = new UserManager();
