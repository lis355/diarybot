module.exports = function getTempFilePath(extension) {
	const directory = app.path.resolve(process.cwd(), "temp");
	app.fs.ensureDirSync(directory);

	extension = extension || "data";
	if (extension.startsWith(".")) {
		extension = extension.slice(1);
	}

	return app.path.join(directory, app.tools.hash(app.time + Math.random()) + "." + extension);
};
