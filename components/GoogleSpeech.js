const { Storage } = require("@google-cloud/storage");
const speech = require("@google-cloud/speech");

module.exports = class GoogleSpeech extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.storage = new Storage();
		this.speechClient = new speech.SpeechClient();
	}

	async audioOggToText(audioFilePath) {
		const bucketAudioFilePath = app.path.basename(audioFilePath);
		const bucket = this.storage.bucket(process.env.GOOGLE_STORAGE_BUCKET_NAME);

		app.log.info(`Загрузка аудио на Google Storage в ${bucketAudioFilePath}`);
		await bucket.upload(audioFilePath, {
			destination: bucketAudioFilePath
		});

		const storageWavAudioFilePath = "gs://" + app.path.posix.join(process.env.GOOGLE_STORAGE_BUCKET_NAME, bucketAudioFilePath);
		const request = {
			audio: {
				uri: storageWavAudioFilePath
				// content: app.fs.readFileSync(wavAudioFilePath).toString("base64")
			},
			config: {
				encoding: "OGG_OPUS",
				sampleRateHertz: 48000,
				audioChannelCount: 1,
				languageCode: "ru-RU",
				model: "default",
				maxAlternatives: 1,
				enableAutomaticPunctuation: true,
				enableSpokenPunctuation: true
			}
		};

		app.log.info("Отправка запроса на декодирование аудио в Google Speech");
		const [operation] = await this.speechClient.longRunningRecognize(request);
		const [response] = await operation.promise();
		app.log.info("Успешно");

		const transcription = response.results.map(result => result.alternatives[0].transcript.trim()).join(app.os.EOL);

		app.log.info(`Удаление временного файла аудио из Google Storage ${bucketAudioFilePath}`);
		await bucket.file(bucketAudioFilePath).delete();

		return transcription;
	}
};
