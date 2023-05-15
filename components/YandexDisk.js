const path = require("path");

const axios = require("axios");

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

	getDiskFilePath(localPath) {
		return path.posix.join(process.env.YANDEX_DISK_DIARY_FOLDER, localPath);
	}

	async downloadFile(filePath) {
		const yandexDiskFilePath = this.getDiskFilePath(filePath);

		console.log(`Скачивание файла с Яндекс Диска ${yandexDiskFilePath}`);

		const fileInfoResponse = await this.infoRequest(yandexDiskFilePath);
		if (fileInfoResponse.path) return downloadFile({ url: fileInfoResponse.file });

		return null;
	}

	async uploadFile(filePath, data) {
		const yandexDiskFilePath = this.getDiskFilePath(filePath);

		console.log(`Загрузка файла на Яндекс Диск ${yandexDiskFilePath}`);

		const yandexDiskDirectory = path.dirname(yandexDiskFilePath);
		const directoryInfoResponse = await this.infoRequest(yandexDiskDirectory);
		if (!directoryInfoResponse.path) await this.createSubFolder(yandexDiskDirectory);

		const uploadResponse = await this.request.get("resources/upload", {
			params: {
				path: yandexDiskFilePath,
				overwrite: "true"
			}
		});

		await this.request.put(uploadResponse.data.href, data);
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
