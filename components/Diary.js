const path = require("path");
const { EOL } = require("os");

const _ = require("lodash");
const moment = require("moment");

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
		return path.posix.join(time.year().toString(), `${_.padStart(time.month() + 1, 2, "0")} ${getMonthName(time.month() + 1)}`, _.padStart(time.date(), 2, "0"));
	}

	getDiaryDirectoryForCurrentTime() {
		return this.getDiaryDirectoryForTime(moment());
	}

	async addTextRecord(text) {
		const directory = this.getDiaryDirectoryForCurrentTime();
		const filePath = path.posix.join(directory, "notes.md");

		let contents = await this.application.yandexDisk.downloadFile(filePath);
		contents = contents ? contents.toString() : "";

		contents += `${moment().format("HH:mm")}${EOL}${text}${EOL}${EOL}`;

		await this.application.yandexDisk.uploadFile(filePath, contents);
	}

	async addPhotoRecord(photoBuffer, caption = undefined) {
		const directory = this.getDiaryDirectoryForCurrentTime();
		const subFilePath = path.posix.join("photo", `${moment().format("HH mm ss")}.jpg`);
		const filePath = path.posix.join(directory, subFilePath);

		await this.application.yandexDisk.uploadFile(filePath, photoBuffer);

		let text = `![[${subFilePath}|200]]`;
		if (caption) text += `${EOL}${caption}`;

		await this.addTextRecord(text);
	}

	async addVoiceRecord(voiceBuffer, text) {
		const directory = this.getDiaryDirectoryForCurrentTime();
		const subFilePath = path.posix.join("voice", `${moment().format("HH mm ss")}.oga`);
		const filePath = path.posix.join(directory, subFilePath);

		await this.application.yandexDisk.uploadFile(filePath, voiceBuffer);

		text = `![[${subFilePath}]]${EOL}${text}`;

		await this.addTextRecord(text);
	}
};
