require("dotenv-flow").config();

const errorHandler = function (error) {
	console.error(error);
};

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

const YandexSpeech = require("./components/YandexSpeech");

(async function () {
	const yandexSpeech = new YandexSpeech(this);
	await yandexSpeech.initialize();

	await yandexSpeech.audioOggToText("./temp/test.oga");
})();
