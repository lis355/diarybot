const path = require("path");
const os = require("os");

const _ = require("lodash");

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

module.exports = class Diary {
	constructor(application) {
		this.application = application;
	}

	async initialize() {
	}

	getDiaryDirectoryForTime(time) {
		return path.posix.join(process.env.YANDEX_DISK_DIARY_FOLDER, time.year().toString(), `${_.padStart(time.month() + 1, 2, "0")} ${getMonthName(time.month() + 1)}`, _.padStart(time.date(), 2, "0"));
	}

	async addTextRecord(text) {
		await this.application.yandexDisk.addTextRecord(text);
	}

	async addVoiceRecord(audioFilePath, text) {
		const yandexDiskAudioFilePath = await this.application.yandexDisk.addVoiceRecord(audioFilePath);

		await this.application.yandexDisk.addTextRecord(`${yandexDiskAudioFilePath}${os.EOL}${os.EOL}${text}`);

		return yandexDiskAudioFilePath;
	}
};
