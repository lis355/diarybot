require("dotenv-flow").config();

const Application = require("./Application");

const errorHandler = function (error) {
	console.error(JSON.stringify(error, null, "\t"));
};

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

const application = new Application();
application.initialize();
