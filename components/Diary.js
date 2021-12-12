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
		return app.path.posix.join(process.env.YANDEXDISK_DIARY_FOLDER, time.year().toString(), `${app.libs._.padStart(time.month() + 1, 2, "0")} ${getMonthName(time.month() + 1)}`, app.libs._.padStart(time.date(), 2, "0"));
	}

	async addTextRecord(text) {
		await app.yandexDisk.addTextRecord(text);
	}

	async addVoiceRecord(audioFilePath, text) {
		let yandexDiskAudioFilePath = await app.yandexDisk.addVoiceRecord(audioFilePath, text);
		yandexDiskAudioFilePath = yandexDiskAudioFilePath.replace(process.env.YANDEXDISK_DIARY_FOLDER, "");

		await app.yandexDisk.addTextRecord(`${yandexDiskAudioFilePath.replace(process.env.YANDEXDISK_DIARY_FOLDER, "")}${app.os.EOL}${app.os.EOL}${text}`);

		return yandexDiskAudioFilePath;
	}
};
