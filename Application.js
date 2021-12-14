const Diary = require("./components/Diary");
const TelegramBot = require("./components/TelegramBot");
const GoogleSpeech = require("./components/GoogleSpeech");
const YandexDisk = require("./components/YandexDisk");

module.exports = class Application {
	constructor() {
		this.components = [
			new Diary(this),
			new TelegramBot(this),
			new GoogleSpeech(this),
			new YandexDisk(this)
		];
	}

	async initialize() {
		for (const component of this.components) {
			await component.initialize();
		}
	}
};
