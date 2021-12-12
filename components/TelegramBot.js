const { Telegraf } = require("telegraf");

const getTempFilePath = require("../tools/getTempFilePath");
const downloadFile = require("../tools/downloadFile");
const convertAudioFile = require("../tools/convertAudioFile");

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

		ctx.reply("Заметка добавлена");
	}

	async processVoiceMessage(ctx) {
		const link = await ctx.telegram.getFileLink(ctx.message.voice["file_id"]);

		const audioFilePath = getTempFilePath("oga");

		await downloadFile({ url: link.href, filePath: audioFilePath });

		const mp3FilePath = getTempFilePath("mp3");

		await convertAudioFile(audioFilePath, mp3FilePath);

		app.fs.removeSync(audioFilePath);

		const text = await app.googleSpeech.audioMp3ToText(mp3FilePath);

		const yandexDiskAudioFilePath = await app.diary.addVoiceRecord(mp3FilePath, text);

		app.fs.removeSync(mp3FilePath);

		ctx.reply(`Аудиозаметка добавлена${app.os.EOL}${yandexDiskAudioFilePath}${app.os.EOL}${app.os.EOL}${text}`);
	}
};
