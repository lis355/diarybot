const path = require("path");
const moment = require("moment");

module.exports = function getTempFilePath(extension = "data") {
	const directory = path.resolve(process.cwd(), "temp");

	if (extension.startsWith(".")) extension = extension.slice(1);
	const fileName = moment() + Math.ceil(Math.random() * 1000) + "." + extension;

	return path.join(directory, fileName);
};
