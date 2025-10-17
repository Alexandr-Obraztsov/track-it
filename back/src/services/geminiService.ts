import dotenv from 'dotenv';
import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import { GEMINI_PROMPTS } from '../configs/geminiPrompts';
import { 
  GeminiResult, 
  TaskExtractionParams
} from '../types';

dotenv.config();

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }


  /**
   * Извлекает задачи из текста или аудио
   */
  async extractTasks(
    params: TaskExtractionParams,
  ): Promise<GeminiResult> {
    const currentTime = new Date();

    try {
      let prompt: string;
      
      if (params.isPersonal) {
        prompt = GEMINI_PROMPTS.extractPersonalTasks(params.text || '', currentTime, params.user, params.existingTasks || []);
      } else {
        prompt = GEMINI_PROMPTS.extractGroupTasks(params.text || '', currentTime, params.chat, params.existingTasks || []);
      }
      

      const content: Part[] = [
        { text: prompt },
      ]

      if (params.audioData) {
        // Убеждаемся, что audioData это Buffer
        const audioBuffer = Buffer.isBuffer(params.audioData) 
          ? params.audioData 
          : Buffer.from(params.audioData);
          
        content.push({
          inlineData: {
            data: audioBuffer.toString('base64'),
            mimeType: params.audioMimeType || 'audio/ogg'
          }
        });
      }

      const geminiResult = await this.model.generateContent(content);
      const result = geminiResult.response.text();

      const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : result;
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error extracting tasks:', error);
      return { newTasks: [], updatedTasks: [] };
    }
  }
}

export const geminiService = new GeminiService();