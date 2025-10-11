import axios from 'axios';
import { Readable } from 'stream';

/**
 * Утилиты для работы с аудио файлами
 */
export class AudioUtils {
  /**
   * Скачивает файл по URL и возвращает Buffer
   */
  static async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error('Failed to download file');
    }
  }

  /**
   * Конвертирует Buffer в base64 строку
   */
  static bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  /**
   * Определяет MIME тип по расширению файла
   */
  static getMimeTypeFromExtension(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'm4a':
        return 'audio/mp4';
      case 'webm':
        return 'audio/webm';
      case 'flac':
        return 'audio/flac';
      case 'aac':
        return 'audio/aac';
      default:
        return 'audio/ogg'; // Telegram voice messages are typically OGG
    }
  }

  /**
   * Обрабатывает голосовое сообщение Telegram
   * Скачивает файл, конвертирует в base64 и определяет MIME тип
   */
  static async processTelegramVoice(fileUrl: string, filename?: string): Promise<{ data: Buffer; mimeType: string }> {
    try {
      // Скачиваем файл
      const audioBuffer = await this.downloadFile(fileUrl);
      
      // Проверяем размер файла (максимум 20MB для Gemini)
      if (!this.isFileSizeValid(audioBuffer, 20)) {
        throw new Error(`Audio file too large: ${this.getFileSizeInMB(audioBuffer).toFixed(2)}MB. Maximum allowed: 20MB`);
      }
      
      // Определяем MIME тип
      const mimeType = filename ? this.getMimeTypeFromExtension(filename) : 'audio/ogg';
      
      return {
        data: audioBuffer,
        mimeType
      };    
    } catch (error) {
      throw new Error('Failed to process voice message');
    }
  }

  /**
   * Получает размер файла в MB
   */
  static getFileSizeInMB(buffer: Buffer): number {
    return buffer.length / (1024 * 1024);
  }

  /**
   * Проверяет, не превышает ли файл максимальный размер (20MB для Gemini)
   */
  static isFileSizeValid(buffer: Buffer, maxSizeMB: number = 20): boolean {
    return this.getFileSizeInMB(buffer) <= maxSizeMB;
  }
}
