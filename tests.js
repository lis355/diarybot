require("dotenv-flow").config();

const errorHandler = function (error) {
	console.error(error.stack);
	console.error(JSON.stringify(error, null, "\t"));
};

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

(async function () {
	// const YandexSpeech = require("./components/YandexSpeech");
	// const yandexSpeech = new YandexSpeech(this);
	// await yandexSpeech.initialize();
	// await yandexSpeech.audioOggToText("./temp/test.oga");

	// const TelegramBot = require("./components/TelegramBot");
	// const telegramBot = new TelegramBot(this);
	// await telegramBot.initialize();
})();
