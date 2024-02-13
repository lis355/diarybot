import YandexDiskApi from "../cloudStorage/YandexDiskApi.js";

export default class User {
	constructor(usersManager, username, config) {
		this.usersManager = usersManager;

		this.username = username;
		this.config = config;

		switch (this.config.storage.type) {
			case "local": this.storageApi = new YandexDiskApi(this.config.yandexDiskOauthToken);
			// case "local": this.storageApi = new YandexDiskApi(this.config.yandexDiskOauthToken);
		}
	}
};
