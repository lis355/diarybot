import ApplicationComponent from "../../ApplicationComponent.js";
import User from "./User.js";

export default class UsersManager extends ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.users = {};
	}

	findUser(username) {
		return this.users[username];
	}

	createUser(username, config) {
		return (this.users[username] = new User(this, username, config));
	}
};
