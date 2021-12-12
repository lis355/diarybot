require("dotenv-flow").config();

const ndapp = require("ndapp");

const Diary = require("./components/Diary");
const TelegramBot = require("./components/TelegramBot");
const GoogleSpeech = require("./components/GoogleSpeech");
const YandexDisk = require("./components/YandexDisk");

class AppManager extends ndapp.Application {
	constructor() {
		super();

		const errorHandler = error => {
			if (error.response) {
				app.log.error(app.tools.json.format(error.response.data));
			} else {
				console.error(error.message);
			}
		};

		this.onUncaughtException = errorHandler;
		this.onUnhandledRejection = errorHandler;
	}

	async run() {
		await super.run();
	}
}

ndapp({
	app: new AppManager(),
	config: false,
	log: false,
	libs: {
		axios: require("axios")
	},
	components: [
		new Diary(),
		new TelegramBot(),
		new GoogleSpeech(),
		new YandexDisk()
	]
});
