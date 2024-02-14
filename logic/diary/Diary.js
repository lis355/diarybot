import _ from "lodash";
import moment from "moment";

import { DirectoryInfo } from "../storage/Storage.js";
import { Path } from "../../tools/Path.js";

const EOL = "\n";
const NOTE_FILE_NAME = new Path("notes.md");

function validateText(str) {
	return str.replace(/\r/g, "");
}

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
		this.lines = [];
	}

	addLine(str) {
		this.lines.push(str);
	}

	toString() {
		return [this.time.format("HH:mm"), ...this.lines].join(EOL);
	}
}

class DiaryNote {
	constructor(date) {
		this.date = date;
		this.records = [];
	}

	addRecord(record) {
		this.records.push(record);
	}

	toString() {
		return this.records.join(EOL + EOL);
	}
}

function formatYear(year) {
	return String(year);
}

function formatMonth(month) {
	return `${_.padStart(month + 1, 2, "0")} ${getMonthName(month + 1)}`;
}

function formatDate(date) {
	return _.padStart(date, 2, "0");
}

function parseYear(year) {
	return parseInt(year);
}

function parseMonth(month) {
	return parseInt(month) - 1;
}

function parseDate(date) {
	return parseInt(date);
}

export default class Diary {
	constructor(user) {
		this.user = user;
	}

	getDiaryNoteDirectoryPathForDate(date) {
		return new Path([formatYear(date.year()), formatMonth(date.month()), formatDate(date.date())]);
	}

	getDiaryNoteDateForDate(date) {
		return moment(date).set("hours", 0).set("minutes", 0).set("seconds", 0).set("milliseconds", 0);
	}

	parseDateFromDiaryDirectory(path) {
		const date = moment(0).set("hours", 0).set("minutes", 0);

		date.set("date", parseInt(path.lastPart));
		path = path.parentPath;

		date.set("month", parseInt(path.lastPart) - 1);
		path = path.parentPath;

		date.set("year", parseInt(path.lastPart));

		return date;
	}

	async loadDiaryNote(notePath) {
		const noteDate = this.parseDateFromDiaryDirectory(notePath.parentPath);
		const diaryNote = new DiaryNote(noteDate);

		const noteContent = validateText((await this.user.storage.readFile(notePath)).toString());
		const lines = noteContent.split(EOL);

		let currentRecord;
		let meetEOL = false;

		function processLastRecord() {
			diaryNote.addRecord(currentRecord);

			meetEOL = false;
		}

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();

			const timeMatch = line.match(/^(\d\d):(\d\d)$/);
			if (timeMatch) {
				const hours = parseInt(timeMatch[1]);
				const minutes = parseInt(timeMatch[2]);
				if (hours >= 0 &&
					hours <= 24 &&
					minutes >= 0 &&
					minutes <= 59) {
					if (currentRecord) processLastRecord();

					const recordDate = moment(diaryNote.date).add(hours, "hours").add(minutes, "minutes");
					currentRecord = new DiaryRecord(recordDate);
				} else throw new Error("Bad format");
			} else if (!line) { // === EOL
				meetEOL = true;
			} else if (currentRecord) {
				if (meetEOL) {
					currentRecord.addLine("");

					meetEOL = false;
				}

				currentRecord.addLine(line);
			} else throw new Error("Bad format");
		}

		if (currentRecord) processLastRecord();

		return diaryNote;
	}

	async saveDiaryNote(diaryNote) {
		const notePath = Path.join(this.getDiaryNoteDirectoryPathForDate(this.getDiaryNoteDateForDate(diaryNote.date)), NOTE_FILE_NAME);
		const noteContent = diaryNote.toString();

		await this.user.storage.ensureDirectory(notePath.parentPath);
		await this.user.storage.createOrUpdateFile(notePath, noteContent);
	}

	async getLastNotePathBeforeDate(date = moment()) {
		let lastNodePath = new Path();

		let objectInfos = await this.user.storage.getDirectoryObjectInfos(lastNodePath);
		if (objectInfos.length === 0) return null;
		let directoryInfo = _.minBy(objectInfos, objectInfo => objectInfo instanceof DirectoryInfo &&
			objectInfo.name.match(/^\d\d\d\d/) &&
			Math.abs(date.year() - parseYear(objectInfo.name)));

		lastNodePath = Path.join(lastNodePath, directoryInfo.name);

		objectInfos = await this.user.storage.getDirectoryObjectInfos(lastNodePath);
		if (objectInfos.length === 0) return null;
		directoryInfo = _.minBy(objectInfos, objectInfo => objectInfo instanceof DirectoryInfo &&
			objectInfo.name.match(/^\d\d/) &&
			Math.abs(date.month() - parseMonth(objectInfo.name)));

		lastNodePath = Path.join(lastNodePath, directoryInfo.name);

		objectInfos = await this.user.storage.getDirectoryObjectInfos(lastNodePath);
		if (objectInfos.length === 0) return null;
		directoryInfo = _.minBy(objectInfos, objectInfo => objectInfo instanceof DirectoryInfo &&
			objectInfo.name.match(/^\d\d/) &&
			Math.abs(date.date() - parseDate(objectInfo.name)));

		lastNodePath = Path.join(lastNodePath, directoryInfo.name, NOTE_FILE_NAME);

		return lastNodePath;
	}

	async addTextRecord({ text, forwardFrom }) {
		const date = moment();
		const noteDate = this.getDiaryNoteDateForDate(date);
		const notePath = Path.join(this.getDiaryNoteDirectoryPathForDate(noteDate), NOTE_FILE_NAME);
		const fileInfo = await this.user.storage.getObjectInfo(notePath);
		const diaryNote = fileInfo.isExists ? await this.loadDiaryNote(notePath) : new DiaryNote(noteDate);

		const diaryRecord = new DiaryRecord(date);

		if (forwardFrom) diaryRecord.addLine(`Переслано от @${forwardFrom}`);

		const lines = validateText(text).split(EOL);

		let meetEOL = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();

			if (!line) { // === EOL
				meetEOL = true;
			} else {
				if (meetEOL) {
					diaryRecord.addLine("");

					meetEOL = false;
				}

				diaryRecord.addLine(line);
			}
		}

		diaryNote.addRecord(diaryRecord);

		await this.saveDiaryNote(diaryNote);
	}

	async addPhotosRecord({ photoBuffers, text: caption = "", forwardFrom }) {
		const date = moment();
		const noteDate = this.getDiaryNoteDateForDate(date);
		const diaryDirectoryPath = this.getDiaryDirectoryPathForDate(noteDate);

		let text = "";

		for (let i = 0; i < photoBuffers.length; i++) {
			const photoBuffer = photoBuffers[i];

			let fileName = date.format("HH mm ss");
			if (photoBuffers.length > 1) fileName += ` [${i}]`;
			fileName += ".jpg";

			const filePath = Path.join(diaryDirectoryPath, "photo", fileName);

			await this.user.storage.ensureDirectory(filePath.parentPath);
			await this.user.storage.createOrUpdateFile(filePath, photoBuffer);

			text += `![[photo/${fileName}|200]]`;
		}

		if (caption) text += caption;

		await this.addTextRecord({ text, forwardFrom });
	}

	async addVoiceRecord({ voiceBuffer, text, forwardFrom }) {
		const date = moment();
		const noteDate = this.getDiaryNoteDateForDate(date);
		const diaryDirectoryPath = this.getDiaryDirectoryPathForDate(noteDate);

		const fileName = `${date.format("HH mm ss")}.oga`;
		const filePath = Path.join(diaryDirectoryPath, "voice", fileName);

		await this.user.storage.ensureDirectory(filePath.parentPath);
		await this.user.storage.createOrUpdateFile(filePath, voiceBuffer);

		text = `![[voice/${fileName}]]${EOL}${text}`;

		await this.addTextRecord({ text, forwardFrom });
	}

	async mergeTwoLastRecord() {
		const lastNotePath = await this.getLastNotePathBeforeDate();
		if (!lastNotePath) return;

		const lastNote = await this.loadDiaryNote(lastNotePath);

		// нет записей - ничего делать не нужно
		// if (lastNote.records.length === 0) return;

		// NOTE пока сложно - это надо будет переность все фотки в другую папку и т.д.
		// if (lastNote.records.length === 1) {
		// 	// нужно получить предыдущую note, удалить lastNote
		// 	const lastNote2Path = await this.getLastNotePathBeforeDate(moment(lastNote.date).subtract(1, "days"));
		// 	// предыдущей нет - ничего не делаем
		// 	if (!lastNote2Path) return;

		// 	const lastNote2 = await this.loadDiaryNote(lastNotePath);
		// }

		if (lastNote.records.length >= 2) {
			const lastRecord = lastNote.records.pop();
			const last2Record = _.last(lastNote.records);

			last2Record.addLine("");
			lastRecord.lines.forEach(line => last2Record.addLine(line));

			await this.saveDiaryNote(lastNote);
		}
	}
};
