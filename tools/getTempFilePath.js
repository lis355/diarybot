const path = require("path");
const fs = require("fs");

const moment = require("moment");

module.exports = function getTempFilePath(extension) {
	const directory = path.resolve(process.cwd(), "temp");
	fs.ensureDirSync(directory);

	extension = extension || "data";
	if (extension.startsWith(".")) {
		extension = extension.slice(1);
	}

	return path.join(directory, moment() + Math.ceil(Math.random() * 1000) + "." + extension);
};
