import YandexDiskApi from "../cloudStorage/YandexDiskApi.js";

export default class User {
	constructor(usersManager, username, config) {
		this.usersManager = usersManager;

		this.username = username;
		this.config = config;

		this.cloudStorageApi = new YandexDiskApi(this.config.yandexDiskOauthToken);
	}
};
