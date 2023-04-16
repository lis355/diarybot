const path = require("path");
const fs = require("fs-extra");
const { EOL } = require("os");
const axios = require("axios");
const moment = require("moment");

const getTempFilePath = require("../tools/getTempFilePath");
const downloadFile = require("../tools/downloadFile");

module.exports = class YandexDisk {
	constructor(application) {
		this.application = application;
	}

	async initialize() {
		this.request = axios.create({
			baseURL: "https://cloud-api.yandex.net/v1/disk/",
			headers: {
				"authorization": "OAuth " + process.env.YANDEX_DISK_OAUTH_TOKEN
			}
		});
	}

	async addTextRecord(text) {
		const directory = this.application.diary.getDiaryDirectoryForTime(moment());
		const yandexDiskFilePath = path.posix.join(directory, "notes.md");

		const filePath = getTempFilePath();

		await this.downloadTextFile(yandexDiskFilePath, filePath);

		fs.appendFileSync(filePath, `${moment().format("HH:mm")}${EOL}${text}${EOL}${EOL}`);

		await this.uploadFile(yandexDiskFilePath, filePath);

		fs.removeSync(filePath);

		console.log(text);
	}

	async addVoiceRecord(audioFilePath) {
		const directory = this.application.diary.getDiaryDirectoryForTime(moment());
		const yandexDiskFilePath = path.posix.join(directory, "voice", `${moment().format("HH mm ss")}${path.extname(audioFilePath)}`);

		await this.uploadFile(yandexDiskFilePath, audioFilePath);

		return yandexDiskFilePath.replace(process.env.YANDEX_DISK_DIARY_FOLDER, "");
	}

	async downloadTextFile(yandexDiskFilePath, filePath) {
		console.log(`Скачивание файла с Яндекс Диска ${yandexDiskFilePath} в ${filePath}`);

		const fileInfoResponse = await this.infoRequest(yandexDiskFilePath);
		if (fileInfoResponse.path) {
			await downloadFile({ url: fileInfoResponse.file, filePath });
		} else {
			fs.outputFileSync(filePath, "");
		}
	}

	async uploadFile(yandexDiskFilePath, filePath) {
		console.log(`Загрузка файла на Яндекс Диск ${yandexDiskFilePath} из ${filePath}`);

		const yandexDiskDirectory = path.dirname(yandexDiskFilePath);
		const directoryInfoResponse = await this.infoRequest(yandexDiskDirectory);
		if (!directoryInfoResponse.path) {
			await this.createSubFolder(yandexDiskDirectory);
		}

		const uploadResponse = await this.request.get("resources/upload", {
			params: {
				path: yandexDiskFilePath,
				overwrite: "true"
			}
		});

		await this.request.put(uploadResponse.data.href, fs.createReadStream(filePath));
	}

	async createSubFolder(yandexDiskDirectory) {
		const subFoldersToCreate = [];

		do {
			const directoryInfoResponse = await this.infoRequest(yandexDiskDirectory);
			if (directoryInfoResponse.path) break;

			subFoldersToCreate.push(yandexDiskDirectory);
			yandexDiskDirectory = path.dirname(yandexDiskDirectory);
		} while (yandexDiskDirectory !== "/");

		subFoldersToCreate.reverse();

		for (const folder of subFoldersToCreate) {
			await this.request.put("resources", null, {
				params: {
					path: folder
				}
			});
		}
	}

	async infoRequest(path) {
		try {
			const response = await this.request.get("resources", {
				params: {
					path
				}
			});

			return response.data;
		} catch (error) {
			if (error.response &&
				error.response.status === 404) {
				return { path: null };
			} else {
				throw error;
			}
		}
	}
};
