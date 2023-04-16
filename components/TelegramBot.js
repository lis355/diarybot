const path = require("path");
const fs = require("fs-extra");
const { EOL } = require("os");
const { Telegraf } = require("telegraf");

const getTempFilePath = require("../tools/getTempFilePath");
const downloadFile = require("../tools/downloadFile");

const MAX_MESSAGE_LENGTH = 4096;
const LOG_MESSAGE_LIFETIME_IN_MILLISECONDS = 10000;

module.exports = class TelegramBot {
	constructor(application) {
		this.application = application;
	}

	async initialize() {
		this.bot = new Telegraf(process.env.TELEGRAM_TOKEN);

		this.bot.on("message", async ctx => {
			if (ctx.message.text) {
				await this.processTextMessage(ctx);
			} else if (ctx.message.voice) {
				await this.processVoiceMessage(ctx);
			}
		});

		this.bot.catch((error, ctx) => {
			console.error(JSON.stringify(error, null, "\t"));

			ctx.reply("Ошибка при добавлении заметки");
		});

		this.bot.launch();
	}

	async processTextMessage(ctx) {
		await this.application.diary.addTextRecord(ctx.message.text);

		console.log("Текстовая заметка добавлена");

		const replyMessageInfo = await ctx.reply("Заметка добавлена");
		setTimeout(() => this.bot.telegram.deleteMessage(replyMessageInfo.chat.id, replyMessageInfo["message_id"]), LOG_MESSAGE_LIFETIME_IN_MILLISECONDS);
	}

	async processVoiceMessage(ctx) {
		const link = await ctx.telegram.getFileLink(ctx.message.voice["file_id"]);
		const url = link.href;

		const audioFilePath = getTempFilePath(path.extname(url));

		console.log(`Скачивание аудиосообщения ${url} в ${audioFilePath}`);
		await downloadFile({ url, filePath: audioFilePath });

		const text = await this.application.yandexSpeech.audioOggToText(audioFilePath);

		const yandexDiskAudioFilePath = await this.application.diary.addVoiceRecord(audioFilePath, text);

		console.log(`Удаление временного файла ${audioFilePath}`);
		fs.removeSync(audioFilePath);

		console.log("Аудиозаметка добавлена");
		await this.sendLongMessage(ctx.message.from.id, `Аудиозаметка добавлена${EOL}${yandexDiskAudioFilePath}${EOL}${EOL}${text}`);
	}

	splitMessageToTelegramBlocks(message) {
		message = this.formatBlockMessage(message);

		const blocks = [];

		if (message.length <= MAX_MESSAGE_LENGTH) {
			blocks.push(message);
		} else {
			let part = "";
			const lines = message.split(EOL);
			for (const line of lines) {
				if (part.length + line.length > MAX_MESSAGE_LENGTH) {
					blocks.push(part);

					part = "";
				}

				part += line + EOL;
			}

			blocks.push(part);
		}

		return blocks;
	}

	formatBlockMessage(message) {
		if (Array.isArray(message)) {
			let blockMessage = "";
			message.forEach(line => { blockMessage += line === EOL ? line : line + EOL; });

			return blockMessage;
		} else {
			return String(message);
		}
	}

	async sendLongMessage(chatId, message) {
		for (const messageBlock of this.splitMessageToTelegramBlocks(message)) {
			await this.bot.telegram.sendMessage(chatId, messageBlock);
		}
	}
};
