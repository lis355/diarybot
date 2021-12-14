require("dotenv-flow").config();

const Application = require("./Application");

const errorHandler = function (error) {
	console.error(error.message);
};

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

const application = new Application();
application.initialize();
