import Diary from "../../logic/diary/Diary.js";
import LocalDiskStorage from "../../logic/storage/LocalDiskStorage.js";
import YandexDiskApi from "../../logic/storage/YandexDiskApi.js";

export default class User {
	constructor(usersManager, username, config) {
		this.usersManager = usersManager;

		this.username = username;
		this.config = config;

		switch (this.config.storage.type) {
			case "local": this.storage = new LocalDiskStorage(this.config.storage); break;
			case "yandexdisk": this.storage = new YandexDiskApi(this.config.storage); break;
		}

		this.diary = new Diary(this);
	}
};
