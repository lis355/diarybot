const { EOL } = require("os");

const { Telegraf } = require("telegraf");
const _ = require("lodash");

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
			console.log(`Сообщение от @${ctx.chat.username} id=${ctx.chat.id}`);

			if (ctx.message.text) {
				await this.processTextMessage(ctx);
			} else if (ctx.message.photo) {
				await this.processPhotoMessage(ctx);
			} else if (ctx.message.voice) {
				await this.processVoiceMessage(ctx);
			}
		});

		this.bot.catch((error, ctx) => {
			console.error(JSON.stringify(error, null, "\t"));

			ctx.reply("Ошибка при добавлении заметки");
		});

		this.bot.launch();

		console.log("Бот начал работу");
	}

	async processTextMessage(ctx) {
		await this.application.diary.addTextRecord(ctx.message.text);

		await this.sendMessageWithAutodelete(ctx.chat.id, "Текстовая заметка добавлена");

		console.log("Текстовая заметка добавлена");
	}

	async processPhotoMessage(ctx) {
		const link = await ctx.telegram.getFileLink(_.last(ctx.message.photo)["file_id"]);
		const url = link.href;

		console.log(`Скачивание фото ${url}`);
		const photoBuffer = await downloadFile({ url });

		await this.application.diary.addPhotoRecord(photoBuffer, ctx.message.caption);

		await this.sendMessageWithAutodelete(ctx.chat.id, "Фото заметка добавлена");

		console.log("Фото заметка добавлена");
	}

	async processVoiceMessage(ctx) {
		const link = await ctx.telegram.getFileLink(ctx.message.voice["file_id"]);
		const url = link.href;

		console.log(`Скачивание аудиосообщения ${url}`);
		const voiceBuffer = await downloadFile({ url });

		const transcription = await this.application.yandexSpeech.audioOggToText(voiceBuffer);

		await this.application.diary.addVoiceRecord(voiceBuffer, transcription);

		await this.sendLongMessage(ctx.message.from.id, transcription);

		console.log("Аудиозаметка добавлена");
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

	async sendMessageWithAutodelete(chatId, message) {
		const replyMessageInfo = await this.bot.telegram.sendMessage(chatId, message);
		setTimeout(() => this.bot.telegram.deleteMessage(chatId, replyMessageInfo["message_id"]), LOG_MESSAGE_LIFETIME_IN_MILLISECONDS);
	}
};
