import {
	stdin as input,
	stdout as output
} from "node:process";
import * as readline from "node:readline/promises";

import _ from "lodash";
import { Telegraf } from "telegraf";
import mediaGroup from "telegraf-media-group";

import ApplicationComponent from "../ApplicationComponent.js";
import AsyncQueue from "../tools/AsyncQueue.js";
import downloadFile from "../tools/downloadFile.js";
import logger from "../tools/logger.js";

const EOL = "\n";
const MAX_MESSAGE_LENGTH = 4096;
const LOG_MESSAGE_LIFETIME_IN_MILLISECONDS = 10000;

function commandMiddleware() {
	return (ctx, next) => {
		const command = ctx.state.command = {
			isValid: false
		};

		const text = _.get(ctx, "message.text");
		if (typeof text === "string") {
			command.isValid = true;

			const parts = text.split(" ");
			command.name = parts[0].substring(1);
			command.arguments = parts.slice(1);
		}

		return next();
	}
}

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
			},
			stop: () => { }
		};
	}

	initializeBot() {
		this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

		const userMiddleware = () => {
			return (ctx, next) => {
				ctx.state.user = this.getUser(ctx.from.username);

				return next();
			}
		}

		const checkUserRoleMiddleware = role => {
			return (ctx, next) => {
				if (ctx.state.user.config.roles.includes(role)) return next();
			}
		}

		this.bot
			.use(userMiddleware())
			.use(mediaGroup())
			.use((ctx, next) => {
				if (!ctx.mediaGroup &&
					ctx.message.photo) {
					ctx.mediaGroup = [ctx.message];
				}

				return next();
			})
			.use(commandMiddleware())
			.command("mrg",
				async ctx => {
					ctx.state.user.processingQueue.push(async () => {
						await this.commandMergeTwoLastRecord(ctx);
					});
				}
			)
			.command("help",
				async ctx => {
					await this.deleteCurrentMessage(ctx);

					await this.sendMessage(ctx.chat.id, `
					/mrg - обьединить две крайние записи
					`);
				}
			)
			.command("stop",
				checkUserRoleMiddleware("admin"),
				async ctx => {
					ctx.state.user.processingQueue.push(async () => {
						await this.application.exit(1);
					});
				}
			)
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
			.launch({ dropPendingUpdates: !this.application.isDevelop });
	}

	getUser(username) {
		const user = this.application.usersManager.findOrCreateUser(username);

		if (!user.processingQueue) user.processingQueue = new AsyncQueue();

		return user;
	}

	async exit() {
		await super.exit();

		this.bot.stop();
	}

	async commandMergeTwoLastRecord(ctx) {
		await this.deleteCurrentMessage(ctx);

		const deleteStartMessage = await this.sendMessage(ctx.chat.id, "Команда выполняется...");

		await ctx.state.user.diary.mergeTwoLastRecord();

		await deleteStartMessage();

		await this.sendMessageWithAutodelete(ctx.chat.id, "Готово");

		logger.info(`[TelegramBot]: commandMergeTwoLastRecord done for user ${ctx.state.user.username}`);
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

		await ctx.state.user.diary.addPhotosRecord({ photoBuffers, text: ctx.message.caption, forwardFrom: this.getForwardFromUsername(ctx.message) });

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

		await ctx.state.user.diary.addVoiceRecord({ voiceBuffer, text: transcription, forwardFrom: this.getForwardFromUsername(ctx.message) });

		await deleteStartMessage();

		await this.sendLongMessage(ctx.message.from.id, transcription);

		logger.info(`[TelegramBot]: voice record added for user ${ctx.state.user.username}`);
	}

	async processTextMessage(ctx) {
		const deleteStartMessage = await this.sendMessage(ctx.chat.id, "Текстовая заметка добавляется...");

		await ctx.state.user.diary.addTextRecord({ text: ctx.message.text, forwardFrom: this.getForwardFromUsername(ctx.message) });

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

		const deleteMessage = async () => this.deleteMessage(chatId, replyMessageInfo["message_id"]);

		return deleteMessage;
	}

	async sendMessageWithAutodelete(chatId, message) {
		const deleteMessage = await this.sendMessage(chatId, message);

		setTimeout(deleteMessage, LOG_MESSAGE_LIFETIME_IN_MILLISECONDS);
	}

	async deleteMessage(chatId, messageId) {
		await this.bot.telegram.deleteMessage(chatId, messageId);
	}

	async deleteCurrentMessage(ctx) {
		await this.bot.telegram.deleteMessage(ctx.chat.id, ctx.message["message_id"]);
	}
};
