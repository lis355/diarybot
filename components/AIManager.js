import stream from "node:stream";

import OpenAI from "openai";

import ApplicationComponent from "../ApplicationComponent.js";
import logger from "../tools/logger.js";

export default class AIManager extends ApplicationComponent {
	async initialize() {
		await super.initialize();

		logger.info(`[AIManager]: creating OpenAI API with base url ${process.env.OPEN_AI_BASE_URL}`);

		this.openai = new OpenAI({
			baseURL: process.env.OPEN_AI_BASE_URL,
			apiKey: process.env.OPEN_AI_API_KEY
		});

		const models = await this.openai.models.list();
		logger.info(`[AIManager]: done, OpenAI API models amount ${models.data.length}`);
	}

	async audioOggToText(oggAudioBuffer) {
		const model = process.env.OPEN_AI_AUDIO_TRANSCRIPTION_MODEL;

		logger.info(`[AIManager]: sending decoding request to model ${model}, ogg file ${oggAudioBuffer.length} bytes`);

		const transcription = await this.openai.audio.transcriptions.create({
			file: stream.Readable.from(oggAudioBuffer),
			model,
			response_format: "text",
			language: "ru"
		});

		logger.info(`[AIManager]: ${transcription}`);

		return transcription;
	}
};
