const getTempFilePath = require("../tools/getTempFilePath");
const downloadFile = require("../tools/downloadFile");

module.exports = class YandexDisk extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.request = app.libs.axios.create({
			baseURL: "https://cloud-api.yandex.net/v1/disk/",
			headers: {
				"authorization": "OAuth " + process.env.YANDEXDISK_OAUTH_TOKEN
			}
		});
	}

	async addTextRecord(text) {
		const directory = app.diary.getDiaryDirectoryForTime(app.time);
		const yandexDiskFilePath = app.path.posix.join(directory, "notes.txt");

		const filePath = getTempFilePath();

		await this.downloadTextFile(yandexDiskFilePath, filePath);

		let record = app.fs.readFileSync(filePath, { encoding: "utf-8" });

		record += `${app.time.format("HH:mm")}${app.os.EOL}${text}${app.os.EOL}${app.os.EOL}`;

		app.fs.writeFileSync(filePath, record);

		await this.uploadFile(yandexDiskFilePath, filePath);

		app.fs.removeSync(filePath);

		app.log.info(text);
	}

	async addVoiceRecord(audioFilePath) {
		const directory = app.diary.getDiaryDirectoryForTime(app.time);
		const yandexDiskFilePath = app.path.posix.join(directory, "voice", `${app.time.format("HH mm")}${app.path.extname(audioFilePath)}`);

		await this.uploadFile(yandexDiskFilePath, audioFilePath);

		return yandexDiskFilePath.replace(process.env.YANDEXDISK_DIARY_FOLDER, "");
	}

	async downloadTextFile(yandexDiskFilePath, filePath) {
		app.log.info(`Скачивание файла с Яндекс Диска ${yandexDiskFilePath} в ${filePath}`);

		const fileInfoResponse = await this.infoRequest(yandexDiskFilePath);
		if (fileInfoResponse.path) {
			await downloadFile({ url: fileInfoResponse.file, filePath });
		} else {
			app.fs.outputFileSync(filePath, "");
		}
	}

	async uploadFile(yandexDiskFilePath, filePath) {
		app.log.info(`Загрузка файла на Яндекс Диск ${yandexDiskFilePath}`);

		const yandexDiskDirectory = app.path.dirname(yandexDiskFilePath);
		const directoryInfoResponse = await this.infoRequest(yandexDiskDirectory);
		if (!directoryInfoResponse.path) {
			await app.yandexDisk.request.put("resources", null, {
				params: {
					path: yandexDiskDirectory
				}
			});
		}

		const uploadResponse = await app.yandexDisk.request.get("resources/upload", {
			params: {
				path: yandexDiskFilePath,
				overwrite: "true"
			}
		});

		await app.yandexDisk.request.put(uploadResponse.data.href, app.fs.createReadStream(filePath));
	}

	async infoRequest(path) {
		try {
			const response = await app.yandexDisk.request.get("resources", {
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
