// import path from "node:path";
// import { EOL } from "node:os";

// import { Storage } from "@google-cloud/storage";
// import speech from "@google-cloud/speech";

// export default class GoogleSpeech {
// 	constructor(application) {
// 		this.application = application;
// 	}

// 	async initialize() {
// 		this.storage = new Storage();
// 		this.speechClient = new speech.SpeechClient();
// 	}

// 	async audioOggToText(audioFilePath) {
// 		const bucketAudioFilePath = path.basename(audioFilePath);
// 		const bucket = this.storage.bucket(process.env.GOOGLE_STORAGE_BUCKET_NAME);

// 		console.log(`Загрузка аудио на Google Storage в ${bucketAudioFilePath}`);
// 		await bucket.upload(audioFilePath, {
// 			destination: bucketAudioFilePath
// 		});

// 		const storageWavAudioFilePath = "gs://" + path.join(process.env.GOOGLE_STORAGE_BUCKET_NAME, bucketAudioFilePath);
// 		const request = {
// 			audio: {
// 				uri: storageWavAudioFilePath
// 				// content: fs.readFileSync(wavAudioFilePath).toString("base64")
// 			},
// 			config: {
// 				encoding: "OGG_OPUS",
// 				sampleRateHertz: 48000,
// 				audioChannelCount: 1,
// 				languageCode: "ru-RU",
// 				model: "default",
// 				maxAlternatives: 1,
// 				enableAutomaticPunctuation: true,
// 				enableSpokenPunctuation: true
// 			}
// 		};

// 		console.log("Отправка запроса на декодирование аудио в Google Speech");
// 		const [operation] = await this.speechClient.longRunningRecognize(request);
// 		const [response] = await operation.promise();
// 		console.log("Успешно");

// 		const transcription = response.results.map(result => result.alternatives[0].transcript.trim()).join(EOL);

// 		console.log(`Удаление временного файла аудио из Google Storage ${bucketAudioFilePath}`);
// 		await bucket.file(bucketAudioFilePath).delete();

// 		return transcription;
// 	}
// };
