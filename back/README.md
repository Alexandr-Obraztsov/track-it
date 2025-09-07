# Backend Project with Telegram Bot

This is a basic Node.js backend project with Express, written in TypeScript with OOP.

## Setup

1. Install dependencies using Yarn:

   ```
   yarn install
   ```

2. Create a `.env` file in the root directory and add your API keys:

   ```
   TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Build the project:

   ```
   yarn build
   ```

4. Start the server:

   ```
   yarn start
   ```

   Or for development with auto-reload:

   ```
   yarn dev
   ```

## Project Structure

- `server.ts`: Main server file (OOP class)
- `controllers/`: Contains controllers for handling requests
  - `exampleController.ts`: Example controller (OOP class)
  - `telegramBotController.ts`: Telegram bot controller (OOP class)
- `routes/`: Contains route definitions
  - `example.ts`: Example routes (OOP class)
  - `telegramBot.ts`: Telegram bot routes (OOP class)
- `models/`: Contains data models
- `middleware/`: Contains middleware functions
- `dist/`: Compiled JavaScript files

## Telegram Bot

The bot is configured to handle basic commands and process voice messages with AI:

Features:

- `/start` - Welcome message
- `/help` - List of available commands
- Voice messages - Automatically downloads, converts to MP3, and processes with Gemini AI for transcription and summary

Voice messages are processed through the following pipeline:

1. Download OGG file from Telegram
2. Convert OGG to MP3 using ffmpeg
3. Send MP3 to Gemini AI for transcription and analysis
4. Return AI response to user
5. Clean up temporary files

To send a message via API:

```
POST /api/telegram/send-message
{
  "chatId": "chat_id",
  "text": "Your message"
}
```

## Proxy Configuration

If you need to use a proxy for API access (common in some regions), configure it in your `.env` file:

```bash
# SOCKS5 proxy (recommended for better compatibility)
SOCKS_PROXY=socks5://username:password@proxy.example.com:1080

# Or SOCKS4
SOCKS_PROXY=socks://username:password@proxy.example.com:1080

# HTTP/HTTPS proxy (also supported)
HTTP_PROXY=http://username:password@proxy.example.com:8080
HTTPS_PROXY=http://username:password@proxy.example.com:8080

# Domains that should not use proxy
NO_PROXY=localhost,127.0.0.1,api.telegram.org
```

The application will automatically detect and use proxy settings for both Telegram Bot API and Gemini AI API. Both SOCKS and HTTP proxies are supported.

## Features

- Telegram bot with voice message processing
- Audio conversion from OGG to MP3
- AI-powered transcription using Google Gemini
- TypeScript with OOP architecture
- Error handling and logging

## Troubleshooting

If you see a polling error like "ETELEGRAM: 404 Not Found", it means your bot token is invalid. Make sure you have set the correct token in the `.env` file.

1. Go to Telegram and search for @BotFather
2. Send `/newbot` and follow the instructions
3. Copy the token and add it to your `.env` file
