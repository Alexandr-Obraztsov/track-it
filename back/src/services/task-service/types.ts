import { Chat } from "../../entities/Chat";
import { GeminiResult } from "../../types";

export type SaveTaskParams = {
  geminiResult: GeminiResult;
  chat: Chat;
};
