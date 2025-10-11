import { User } from "../entities/User";

export class Formatter {
  // Для работы с пользователями

  static tagUser(user: User) {
    return `[@${user.username}](tg://user?id=${user.id})`;
  }
}