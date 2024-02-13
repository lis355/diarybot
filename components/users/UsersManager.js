import ApplicationComponent from "../../ApplicationComponent.js";
import User from "./User.js";

export default class UsersManager extends ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.users = new Map();
	}

	findUser(username) {
		return this.users.get(username);
	}

	findOrCreateUser(username) {
		let user = this.findUser(username);
		if (!user) {
			const config = this.application.db.get(`users.${username}`).value();
			if (!config) throw new Error(`Неизвестный пользователь @${username}`);

			user = new User(this, username, config);
			this.users.set(username, user);
		}

		return user;
	}
};
