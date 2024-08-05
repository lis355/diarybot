import awsSdkClient from "@aws-sdk/client-s3";
import awsSdkStorage from "@aws-sdk/lib-storage";
import axios from "axios";
import delay from "delay";
import uniqid from "uniqid";
import urljoin from "url-join";

import ApplicationComponent from "../ApplicationComponent.js";
import logger from "../tools/logger.js";

const CHAR_DOT = ".";
const CHAR_EOL = "\n";
const CHAR_HASHTAG = "#";
const CHAR_SPACE = " ";
const WORD_CARRIAGE_RETURN = "абзац";
const WORD_DOT = "точка";
const WORD_HASHTAG = "хэштег";
const WORD_PARAGRAPH = "параграф";
const SPECIAL_STRING_PARAGRAPH = "[[p]]";

export default class YandexSpeech extends ApplicationComponent {
	async initialize() {
		await super.initialize();

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

	async audioOggToText(voiceBuffer) {
		const bucketFileKey = `${uniqid()}.oga`;

		logger.info(`[YandexSpeech]: загрузка аудио на Yandex Object Storage ${bucketFileKey}`);

		const uploadResponsePromise = new awsSdkStorage.Upload({
			client: this.s3Client,
			params: {
				Bucket: process.env.YANDEX_OBJECT_STORAGE_BUCKET,
				Key: bucketFileKey,
				Body: voiceBuffer
			}
		});

		await uploadResponsePromise.done();

		logger.info(`[YandexSpeech]: отправка запроса на декодирование аудио в Yandex Speech Kit ${bucketFileKey}`);

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
			logger.info(`[YandexSpeech]: обновление статуса запроса на декодирование аудио в Yandex Speech Kit ${bucketFileKey}`);

			const response = await this.request.get(urljoin("https://operation.api.cloud.yandex.net/operations/", recognizeOperationId));

			if (response.data.done) {
				// fs.outputFileSync(path.join(this.application.userDataPath, "response.json"), JSON.stringify(response.data, null, "\t"));

				transcription = this.getTranscriptionFromResponseData(response.data);

				break;
			} else {
				await delay(1000);
			}
		}

		logger.info(`[YandexSpeech]: декодирование аудио в Yandex Speech Kit ${bucketFileKey} завершено успешно`);

		logger.info(`[YandexSpeech]: удаление временного файла аудио из Yandex Object Storage ${bucketFileKey}`);

		await this.s3Client.send(new awsSdkClient.DeleteObjectCommand({
			Bucket: process.env.YANDEX_OBJECT_STORAGE_BUCKET,
			Key: bucketFileKey
		}));

		logger.info(`[YandexSpeech]: удаление временного файла аудио из Yandex Object Storage ${bucketFileKey} завершено успешно`);

		return transcription;
	}

	getTranscriptionFromResponseData(data) {
		// let originalTranscription = "";
		let transcription = "";

		function processSubstring(text, substring, textTransform) {
			while (true) {
				const textInLowerCase = text.toLowerCase();

				const index = textInLowerCase.indexOf(substring);
				if (index === -1) break;

				let leftString = text.substring(0, index).trim();
				let rightString = text.substring(index + substring.length).trim();

				if (leftString.endsWith(CHAR_DOT)) leftString = leftString.substring(0, leftString.length - 1).trim();
				if (rightString.startsWith(CHAR_DOT)) rightString = rightString.substring(1).trim();

				text = textTransform(leftString, rightString, substring);
			}

			return text;
		}

		for (const chunk of data.response.chunks) {
			for (const alternative of chunk.alternatives) {
				let text = alternative.text;

				// originalTranscription += text;

				text = processSubstring(text, WORD_DOT, (leftString, rightString, substring) => {
					let result = "";
					if (leftString) result += leftString + CHAR_DOT;
					if (rightString) result += CHAR_SPACE + rightString;

					return result;
				});

				text = processSubstring(text, WORD_CARRIAGE_RETURN, (leftString, rightString, substring) => {
					let result = "";
					if (leftString) result += leftString + CHAR_DOT;
					result += CHAR_EOL;
					if (rightString) result += rightString;

					return result;
				});

				text = processSubstring(text, WORD_PARAGRAPH, (leftString, rightString, substring) => {
					let result = "";
					if (leftString) result += leftString + CHAR_DOT;
					result += SPECIAL_STRING_PARAGRAPH;
					if (rightString) result += rightString;

					return result;
				});

				text = processSubstring(text, WORD_HASHTAG, (leftString, rightString, substring) => {
					let result = "";
					if (leftString) result += leftString + CHAR_DOT;
					result += SPECIAL_STRING_PARAGRAPH;
					if (rightString) result += CHAR_HASHTAG + rightString;

					return result;
				});

				transcription += text.trim();
			}

			transcription = transcription.trim() + CHAR_EOL;
		}

		transcription = processSubstring(transcription, SPECIAL_STRING_PARAGRAPH, (leftString, rightString, substring) => {
			return leftString + CHAR_EOL + CHAR_EOL + rightString;
		});

		transcription = transcription.trim();

		// logger.info(`[YandexSpeech]: получена транскрипция ${CHAR_EOL}${originalTranscription}`);
		// logger.info(`[YandexSpeech]: обработанная транскрипция ${CHAR_EOL}${transcription}`);

		return transcription;
	}
};
