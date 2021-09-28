const ndapp = require("ndapp");

const Diary = require("./components/Diary");
const TelegramBot = require("./components/TelegramBot");

ndapp({
	config: true,
	libs: {
		axios: require("axios")
	},
	components: [
		new Diary(),
		new TelegramBot()
	]
});
