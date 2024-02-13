// DEBUG
import fs from "node:fs";
import path from "node:path";

import Diary from "./components/Diary.js";
import TelegramBot from "./components/TelegramBot.js";
import UsersManager from "./components/users/UsersManager.js";
import YandexSpeech from "./components/YandexSpeech.js";
import { createDB, YAMLFileAdapter } from "./tools/tinyDB.js";

const DB_FILE_PATH = "db.yml";

export default class Application {
	constructor() {
		this.components = [];

		this.addComponent(this.diary = new Diary(this));
		this.addComponent(this.usersManager = new UsersManager(this));
		this.addComponent(this.yandexSpeech = new YandexSpeech(this));
		this.addComponent(this.telegramBot = new TelegramBot(this));
	}

	addComponent(component) {
		this.components.push(component);
	}

	async initialize() {
		this.db = await createDB({
			adapter: new YAMLFileAdapter(DB_FILE_PATH),
			defaults: {
				users: {}
			}
		});

		for (const component of this.components) await component.initialize();

		// DEBUG
		const user = this.usersManager.findOrCreateUser("lis355");
		const notePath = "D:/YandexDisk/LIFE/Дневник/2024/02 Февраль/12/notes.md";
		this.diary.parseDiaryNote(
			this.diary.parseDateFromDiaryDirectory(path.dirname(notePath)),
			fs.readFileSync(notePath).toString()
		);
	}

	get isDevelop() {
		return process.env.DEVELOP === "true";
	}
};
