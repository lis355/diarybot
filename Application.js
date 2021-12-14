const Diary = require("./components/Diary");
const TelegramBot = require("./components/TelegramBot");
const GoogleSpeech = require("./components/GoogleSpeech");
const YandexDisk = require("./components/YandexDisk");

module.exports = class Application {
	constructor() {
		this.components = [
			this.diary = new Diary(this),
			this.telegramBot = new TelegramBot(this),
			this.googleSpeech = new GoogleSpeech(this),
			this.yandexDisk = new YandexDisk(this)
		];
	}

	async initialize() {
		for (const component of this.components) {
			await component.initialize();
		}
	}
};
