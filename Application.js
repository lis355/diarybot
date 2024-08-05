import path from "node:path";

import { createDB, YAMLFileAdapter } from "./tools/tinyDB.js";
import fs from "fs-extra";
import TelegramBot from "./components/TelegramBot.js";
import UsersManager from "./components/users/UsersManager.js";
import YandexSpeech from "./components/YandexSpeech.js";

const DB_FILE_PATH = "db.yml";

export default class Application {
	constructor() {
		this.components = [];

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

		if (this.isDevelop &&
			fs.existsSync("./onRun.js")) await (await import("./onRun.js")).default(this);
	}

	get isDevelop() {
		return process.env.DEVELOP === "true";
	}

	get userDataPath() {
		return path.resolve(process.cwd(), process.env.USER_DATA_PATH);
	}
};
