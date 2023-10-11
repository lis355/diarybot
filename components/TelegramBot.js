import { EOL } from "node:os";
import * as readline from "node:readline/promises";
import {
	stdin as input,
	stdout as output
} from "node:process";

import { Telegraf } from "telegraf";
import mediaGroup from "telegraf-media-group";
import _ from "lodash";

import ApplicationComponent from "../ApplicationComponent.js";
import AsyncQueue from "../tools/AsyncQueue.js";
import downloadFile from "../tools/downloadFile.js";
import logger from "../tools/logger.js";

const MAX_MESSAGE_LENGTH = 4096;
const LOG_MESSAGE_LIFETIME_IN_MILLISECONDS = 10000;

export default class TelegramBot extends ApplicationComponent {
	async initialize() {
		await super.initialize();

		if (this.application.isDevelop &&
			process.env.DEBUG_EMULATE_TG_BY_CONSOLE === "true") {
			this.initializeDevelop();
		} else {
			this.initializeBot();
		}

		logger.info("[TelegramBot]: started");
	}

	initializeDevelop() {
		readline.createInterface({ input, output })
			.on("line", async line => {
				await this.processTextMessage({
					chat: {
						id: "MOCK_ID"
					},
					message: {
						text: line
					},
					state: {
						user: this.getUser("mockUser")
					}
				});
			});

		this.bot = {
			telegram: {
				sendMessage: async (chatId, message) => {
					console.log(message);

					return {
						"message_id": Math.random()
					};
				},
				deleteMessage: async (chatId, messageId) => { }
			}
		};
	}

	initializeBot() {
		this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

		this.bot
			.use((ctx, next) => {
				ctx.state.user = this.getUser(ctx.from.username);

				return next();
			})
			.use(mediaGroup())
			.use((ctx, next) => {
				if (!ctx.mediaGroup &&
					ctx.message.photo) {
					ctx.mediaGroup = [ctx.message];
				}

				return next();
			})
			.on("message", async ctx => {
				logger.info(`[TelegramBot]: message from @${ctx.state.user.username} id=${ctx.chat.id}`);

				ctx.state.user.processingQueue.push(async () => {
					if (ctx.mediaGroup) {
						await this.processPhotosMessage(ctx);
					} else if (ctx.message.voice) {
						await this.processVoiceMessage(ctx);
					} else if (ctx.message.text) {
						await this.processTextMessage(ctx);
					}
				});
			})
			.catch((error, ctx) => {
				console.error(error);
			})
			.launch();
	}

	getUser(username) {
		let user = this.application.usersManager.findUser(username);
		if (!user) {
			const userConfig = this.application.db.get(`users.${username}`).value();
			if (userConfig) user = this.application.usersManager.createUser(username, userConfig);

			user.processingQueue = new AsyncQueue();
		}

		if (!user) throw new Error(`Неизвестный пользователь @${username}`);

		return user;
	}

	async processPhotosMessage(ctx) {
		const deleteStartMessage = await this.sendMessage(ctx.chat.id, "Фото заметка добавляется...");

		const photoBuffers = [];

		for (const mediaItem of ctx.mediaGroup) {
			const link = await ctx.telegram.getFileLink(_.last(mediaItem.photo)["file_id"]);
			const url = link.href;

			logger.info(`[TelegramBot]: downloading photo ${url}`);

			const photoBuffer = await downloadFile({ url });
			photoBuffers.push(photoBuffer);
		}

		await this.application.diary.addPhotosRecord({ user: ctx.state.user, photoBuffers, text: ctx.message.caption, forwardFrom: this.getForwardFromUsername(ctx.message) });

		await deleteStartMessage();

		await this.sendMessageWithAutodelete(ctx.chat.id, "Фото заметка добавлена");

		logger.info(`[TelegramBot]: photos record added for user ${ctx.state.user.username}`);
	}

	async processVoiceMessage(ctx) {
		const deleteStartMessage = await this.sendMessage(ctx.chat.id, "Аудио заметка добавляется...");

		const link = await ctx.telegram.getFileLink(ctx.message.voice["file_id"]);
		const url = link.href;

		logger.info(`[TelegramBot]: downloading voice message ${url}`);

		const voiceBuffer = await downloadFile({ url });

		const transcription = await this.application.yandexSpeech.audioOggToText(voiceBuffer);

		await this.application.diary.addVoiceRecord({ user: ctx.state.user, voiceBuffer, text: transcription, forwardFrom: this.getForwardFromUsername(ctx.message) });

		await deleteStartMessage();

		await this.sendLongMessage(ctx.message.from.id, transcription);

		logger.info(`[TelegramBot]: voice record added for user ${ctx.state.user.username}`);
	}

	async processTextMessage(ctx) {
		const deleteStartMessage = await this.sendMessage(ctx.chat.id, "Текстовая заметка добавляется...");

		await this.application.diary.addTextRecord({ user: ctx.state.user, text: ctx.message.text, forwardFrom: this.getForwardFromUsername(ctx.message) });

		await deleteStartMessage();

		await this.sendMessageWithAutodelete(ctx.chat.id, "Текстовая заметка добавлена");

		logger.info(`[TelegramBot]: text record added for user ${ctx.state.user.username}`);
	}

	getForwardFromUsername(message) {
		const forwardFromInfo = message["forward_from"];

		return forwardFromInfo ? forwardFromInfo.username : null;
	}

	splitMessageToTelegramBlocks(message) {
		message = this.formatBlockMessage(message);

		const blocks = [];

		if (message.length <= MAX_MESSAGE_LENGTH) {
			blocks.push(message);
		} else {
			let part = "";
			const lines = message.split(EOL);
			for (const line of lines) {
				if (part.length + line.length > MAX_MESSAGE_LENGTH) {
					blocks.push(part);

					part = "";
				}

				part += line + EOL;
			}

			blocks.push(part);
		}

		return blocks;
	}

	formatBlockMessage(message) {
		if (Array.isArray(message)) {
			let blockMessage = "";
			message.forEach(line => { blockMessage += line === EOL ? line : line + EOL; });

			return blockMessage;
		} else {
			return String(message);
		}
	}

	async sendLongMessage(chatId, message) {
		for (const messageBlock of this.splitMessageToTelegramBlocks(message)) await this.sendMessage(chatId, messageBlock);
	}

	async sendMessage(chatId, message) {
		const replyMessageInfo = await this.bot.telegram.sendMessage(chatId, message);

		const deleteMessage = async () => this.bot.telegram.deleteMessage(chatId, replyMessageInfo["message_id"]);

		return deleteMessage;
	}

	async sendMessageWithAutodelete(chatId, message) {
		const deleteMessage = await this.sendMessage(chatId, message);

		setTimeout(deleteMessage, LOG_MESSAGE_LIFETIME_IN_MILLISECONDS);
	}
};
