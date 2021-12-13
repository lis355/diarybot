const { Telegraf } = require("telegraf");

const getTempFilePath = require("../tools/getTempFilePath");
const downloadFile = require("../tools/downloadFile");

module.exports = class TelegramBot extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

		bot.on("message", async ctx => {
			if (ctx.message.text) {
				await this.processTextMessage(ctx);
			} else if (ctx.message.voice) {
				await this.processVoiceMessage(ctx);
			}
		});

		bot.launch();
	}

	async processTextMessage(ctx) {
		await app.diary.addTextRecord(ctx.message.text);

		app.log.info("Текстовая заметка добавлена");
		ctx.reply("Заметка добавлена");
	}

	async processVoiceMessage(ctx) {
		const link = await ctx.telegram.getFileLink(ctx.message.voice["file_id"]);

		const audioFilePath = getTempFilePath(app.path.extname(link));

		app.log.info(`Скачивание аудиосообщения ${link.href} в ${audioFilePath}`);
		await downloadFile({ url: link.href, filePath: audioFilePath });

		const text = await app.googleSpeech.audioOggToText(audioFilePath);

		const yandexDiskAudioFilePath = await app.diary.addVoiceRecord(audioFilePath, text);

		app.log.info(`Удаление временного файла ${audioFilePath}`);
		app.fs.removeSync(audioFilePath);

		app.log.info("Аудиозаметка добавлена");
		ctx.reply(`Аудиозаметка добавлена${app.os.EOL}${yandexDiskAudioFilePath}${app.os.EOL}${app.os.EOL}${text}`);
	}
};
