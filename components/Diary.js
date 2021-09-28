function getMonthName(month) {
	switch (month) {
		case 1: return "Январь";
		case 2: return "Февраль";
		case 3: return "Март";
		case 4: return "Апрель";
		case 5: return "Май";
		case 6: return "Июнь";
		case 7: return "Июль";
		case 8: return "Август";
		case 9: return "Сентябрь";
		case 10: return "Октябрь";
		case 11: return "Ноябрь";
		case 12: return "Декабрь";
	}
}

module.exports = class Diary extends ndapp.ApplicationComponent {
	getDiaryDirectoryForTime(time) {
		return app.path.join(app.config.diaryFolder, time.year().toString(), `${app.libs._.padStart(time.month() + 1, 2, "0")} ${getMonthName(time.month() + 1)}`);
	}

	addTextRecord(text) {
		const time = app.time;

		const directory = this.getDiaryDirectoryForTime(time);
		app.fs.ensureDirSync(directory);

		const path = app.path.join(directory, `${app.libs._.padStart(time.date().toString(), 2, "0")}.txt`);

		let record = `${time.format("HH:mm")}${app.os.EOL}${text}${app.os.EOL}${app.os.EOL}`;

		if (app.fs.existsSync(path)) {
			record = app.fs.readFileSync(path) + record;
		}

		app.fs.writeFileSync(path, record);

		app.log.info(text);
	}
};
