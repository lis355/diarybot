import { config as dotenv } from "dotenv-flow";

import Application from "./Application.js";

dotenv();

const errorHandler = function (error) {
	console.error(error.stack);
};

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

const application = new Application();
application.initialize();
