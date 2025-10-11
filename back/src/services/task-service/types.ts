import { Chat } from "../../entities/Chat";
import { Task } from "../../entities/Task";
import { User } from "../../entities/User";
import { GeminiResult } from "../../types";

export type SaveTaskParams = {
  geminiResult: GeminiResult;
} & ({
  chat: Chat;
  isPersonal: false;
} | {
  user: User;
  isPersonal: true;
});
