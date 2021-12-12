const speech = require("@google-cloud/speech");

const getTempFilePath = require("../tools/getTempFilePath");
const convertAudioFile = require("../tools/convertAudioFile");

module.exports = class GoogleSpeech extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.client = new speech.SpeechClient();
	}

	async audioMp3ToText(mp3AudioFilePath) {
		const wavAudioFilePath = getTempFilePath("wav");
		await convertAudioFile(mp3AudioFilePath, wavAudioFilePath);

		const request = {
			audio: {
				content: app.fs.readFileSync(wavAudioFilePath).toString("base64")
			},
			config: {
				encoding: "LINEAR16",
				sampleRateHertz: 48000,
				languageCode: "ru-RU",
				model: "default",
				enableAutomaticPunctuation: true
			}
		};

		const response = await this.client.recognize(request);

		app.fs.removeSync(wavAudioFilePath);

		const transcription = response[0].results.map(result => result.alternatives[0].transcript).join(app.os.EOL);

		return transcription;
	}
};
