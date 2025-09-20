import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'

export function ensureDownloadsDirectory(): void {
	const downloadsDir = path.join(__dirname, '../downloads')
	if (!fs.existsSync(downloadsDir)) {
		fs.mkdirSync(downloadsDir, { recursive: true })
	}
}

export async function convertOggToMp3(inputPath: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		ffmpeg(inputPath)
			.toFormat('mp3')
			.on('end', () => resolve())
			.on('error', (err: any) => reject(err))
			.save(outputPath)
	})
}
