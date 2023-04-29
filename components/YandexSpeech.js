const path = require("path");

const fs = require("fs-extra");
const awsSdkClient = require("@aws-sdk/client-s3");
const awsSdkStorage = require("@aws-sdk/lib-storage");
const axios = require("axios");
const urljoin = require("url-join");
const delay = require("delay");

module.exports = class YandexSpeech {
	constructor(application) {
		this.application = application;
	}

	async initialize() {
		this.request = axios.create({
			headers: {
				"authorization": "Api-Key " + process.env.YANDEX_CLOUD_API_KEY
			}
		});

		this.s3Client = new awsSdkClient.S3Client({
			credentials: {
				accessKeyId: process.env.YANDEX_CLOUD_STATIC_KEY_ID,
				secretAccessKey: process.env.YANDEX_CLOUD_STATIC_KEY_SECRET
			},
			region: "ru-central1",
			endpoint: "https://s3.yandexcloud.net"
		});
	}

	async audioOggToText(audioFilePath) {
		console.log(`Загрузка аудио на Yandex Object Storage из ${audioFilePath}`);

		const uploadResponsePromise = new awsSdkStorage.Upload({
			client: this.s3Client,
			params: {
				Bucket: process.env.YANDEX_OBJECT_STORAGE_BUCKET,
				Key: path.basename(audioFilePath),
				Body: fs.readFileSync(audioFilePath)
			}
		});

		const uploadResponse = await uploadResponsePromise.done();

		const bucketFileKey = uploadResponse.Key;

		console.log("Отправка запроса на декодирование аудио в Yandex Speech Kit");

		const recognizeResponse = await this.request.post("https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize", {
			config: {
				specification: {
					languageCode: "ru-RU",
					model: "general",
					profanityFilter: false,
					literature_text: true,
					audioEncoding: "OGG_OPUS",
					sampleRateHertz: 48000,
					audioChannelCount: 1
				}
			},
			audio: {
				uri: urljoin(`https://${process.env.YANDEX_OBJECT_STORAGE_BUCKET}.storage.yandexcloud.net`, bucketFileKey)
			}
		});

		const recognizeOperationId = recognizeResponse.data.id;

		let transcription;
		while (true) {
			const response = await this.request.get(urljoin("https://operation.api.cloud.yandex.net/operations/", recognizeOperationId));

			if (response.data.done) {
				transcription = response.data.response.chunks.map(chunks => chunks.alternatives.map(alternative => alternative.text).join(". ")).join(" ");
				break;
			} else {
				await delay(1000);
			}
		}

		console.log("Успешно");

		console.log(`Удаление временного файла аудио из Yandex Object Storage ${bucketFileKey}`);

		await this.s3Client.send(new awsSdkClient.DeleteObjectCommand({
			Bucket: process.env.YANDEX_OBJECT_STORAGE_BUCKET,
			Key: bucketFileKey
		}));

		return transcription;
	}
};
