function log(level, objects) {
	if (!Array.isArray(objects)) objects = [objects];

	objects = objects.map(String).join(" ");

	(level === "ERROR" ? console.error : console.log)(`[${new Date().toISOString()}] ${level} ${objects}`);
}

const loggers = {};

["INFO", "WARNING", "ERROR"].forEach(level => {
	loggers[level.toLowerCase()] = objects => log(level, objects);
})

export default loggers;
