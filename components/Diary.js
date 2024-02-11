import path from "node:path";
import { EOL } from "node:os";

import _ from "lodash";
import moment from "moment";

import ApplicationComponent from "../ApplicationComponent.js";

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

class DiaryRecord {
	constructor(time = moment()) {
		this.time = time;
		this.contents = [];
	}

	addText(text) {
		this.contents.push({ type: "text", text });
	}
}

export default class Diary extends ApplicationComponent {
	getDiaryDirectoryForTime(time) {
		return path.join(time.year().toString(), `${_.padStart(time.month() + 1, 2, "0")} ${getMonthName(time.month() + 1)}`, _.padStart(time.date(), 2, "0"));
	}

	getDiaryDirectoryForCurrentTime() {
		return this.getDiaryDirectoryForTime(moment());
	}

	parseDiaryNote(strContents) {
		const records = [];

		const lines = strContents.split(EOL);

		let currentRecord;
		const content;

		function processLastContent() {
			if (!currentRecord) return;


		}

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (/^\d\d:\d\d$/.test()) {

			}
		}
	}

	async addTextRecord({ user, text, forwardFrom }) {
		const filePath = path.join(user.config.cloudStorageDiaryFolder, this.getDiaryDirectoryForCurrentTime(), "notes.md");

		const notesFileInfo = await user.cloudStorageApi.getObjectInfo(filePath);
		let contents = notesFileInfo.exists ? (await user.cloudStorageApi.downloadFile(notesFileInfo)).toString() : "";

		contents += `${moment().format("HH:mm")}${EOL}`;
		if (forwardFrom) contents += `Переслано от @${forwardFrom}${EOL}`;
		contents += `${text}${EOL}${EOL}`;

		await user.cloudStorageApi.uploadFile(filePath, contents);
	}

	async addPhotosRecord({ user, photoBuffers, text: caption = "", forwardFrom }) {
		let text = "";

		for (const photoBuffer of photoBuffers) {
			const fileName = `${moment().format("HH mm ss")}.jpg`;
			const filePath = path.join(user.config.cloudStorageDiaryFolder, this.getDiaryDirectoryForCurrentTime(), "photo", fileName);

			await user.cloudStorageApi.uploadFile(filePath, photoBuffer);

			text += `![[photo/${fileName}|200]]${EOL}`;
		}

		if (caption) text += caption;

		await this.addTextRecord({ user, text, forwardFrom });
	}

	async addVoiceRecord({ user, voiceBuffer, text, forwardFrom }) {
		const fileName = `${moment().format("HH mm ss")}.oga`;
		const filePath = path.join(user.config.cloudStorageDiaryFolder, this.getDiaryDirectoryForCurrentTime(), "voice", fileName);

		await user.cloudStorageApi.uploadFile(filePath, voiceBuffer);

		text = `![[voice/${fileName}]]${EOL}${text}`;

		await this.addTextRecord({ user, text, forwardFrom });
	}
};
