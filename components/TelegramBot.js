const { Telegraf } = require("telegraf");

const downloadFile = require("../tools/downloadFile");
const executeShellCommand = require("../tools/executeShellCommand");

module.exports = class TelegramBot extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		const bot = new Telegraf(app.config.telegramToken);

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
		app.diary.addTextRecord(ctx.message.text);

		ctx.reply("Заметка добавлена");
	}

	async processVoiceMessage(ctx) {
		const link = await ctx.telegram.getFileLink(ctx.message.voice["file_id"]);

		const time = app.time;
		const audioFilePath = app.path.resolve(process.cwd(), app.path.join("temp", `${time.valueOf()}.oga`));

		await downloadFile({ url: link.href, filePath: audioFilePath });

		const directory = app.path.join(app.diary.getDiaryDirectoryForTime(app.time), "voice");
		app.fs.ensureDirSync(directory);

		const mp3FileName = time.format("HH mm");
		const mp3FileNameWithExtension = `${mp3FileName}.mp3`;
		const mp3FilePath = app.path.join(directory, mp3FileNameWithExtension);

		await executeShellCommand({ cmd: `"${app.config.ffmpegPath}" -i "${audioFilePath}" -ac 1 "${mp3FilePath}"` });

		app.fs.removeSync(audioFilePath);

		app.diary.addTextRecord(mp3FileNameWithExtension);

		ctx.reply("Аудиозаметка добавлена");
	}
};
