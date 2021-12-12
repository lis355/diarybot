module.exports = function getTempFilePath(extension) {
	const directory = app.path.resolve(process.cwd(), "temp");
	app.fs.ensureDirSync(directory);

	return app.path.join(directory, app.tools.hash(app.time + Math.random()) + "." + (extension || "data"));
};
