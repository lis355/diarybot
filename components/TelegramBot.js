const path = require("path");
const fs = require("fs-extra");
const os = require("os");

const { Telegraf } = require("telegraf");

const getTempFilePath = require("../tools/getTempFilePath");
const downloadFile = require("../tools/downloadFile");

const MAX_MESSAGE_LENGTH = 4096;

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
		ctx.reply("Заметка добавлена");
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
		await this.sendLongMessage(ctx.message.from.id, `Аудиозаметка добавлена${os.EOL}${yandexDiskAudioFilePath}${os.EOL}${os.EOL}${text}`);
	}

	async sendLongMessage(chatId, message) {
		for (let i = 0; i < message.length; i += MAX_MESSAGE_LENGTH) {
			await this.bot.telegram.sendMessage(chatId, message.substring(i, i + MAX_MESSAGE_LENGTH));
		}
	}
};
