import path from "node:path";

import { StorageApi, DirectoryInfo, FileInfo, normalizePath, NONE_OBJECT } from "./StorageApi.js";
import logger from "../../tools/logger.js";

const BASE_DIRECTORY = "/";

export default class YandexDiskApi extends StorageApi {
	constructor(basePath) {
		super();

		this.basePath = basePath;
	}

	async getObjectInfo(path) {
		path = normalizePath(path);

		logger.info(`[YandexDiskApi]: getFileInfo ${path}`);

		try {
			const response = await this.request.get("resources", {
				params: {
					path
				}
			});

			const resourceInfo = response.data;
			if (resourceInfo.type === "dir") return new DirectoryInfo({ path, meta: resourceInfo });
			else if (resourceInfo.type === "file") return new FileInfo({ path, meta: resourceInfo });
		} catch (error) {
			if (error.response &&
				error.response.status === StatusCodes.NOT_FOUND) return NONE_OBJECT;

			throw error;
		}

		return NONE_OBJECT;
	}

	// async createDirectory(directoryInfo) { }
	// async deleteDirectory(directoryInfo) { }

	// async createOrUpdateFile(filePath, data) { }
	// async readFile(fileInfo) { }
	// async deleteFile(filePath) { }

	async createDirectory(directoryPath) {
		directoryPath = normalizePath(directoryPath);

		await this.request.put("resources", null, {
			params: {
				path: directoryPath
			}
		});
	}

	async ensureDirectory(directoryPath) {
		directoryPath = normalizePath(directoryPath);

		const subFoldersToCreate = [];

		do {
			const info = await this.getObjectInfo(directoryPath);
			if (info.isDirectory) break;

			subFoldersToCreate.push(directoryPath);
			directoryPath = path.dirname(directoryPath);
		} while (directoryPath !== BASE_DIRECTORY);

		subFoldersToCreate.reverse();

		for (const directory of subFoldersToCreate) await this.createDirectory(directory);
	}

	async downloadFile(fileInfo) {
		logger.info(`[YandexDiskApi]: downloadFile ${fileInfo.path}`);

		return downloadFile({ url: fileInfo.meta.file });
	}

	async uploadFile(filePath, data) {
		filePath = normalizePath(filePath);

		logger.info(`[YandexDiskApi]: uploadFile ${filePath}`);

		await this.ensureDirectory(path.dirname(filePath));

		const uploadResponse = await this.request.get("resources/upload", {
			params: {
				path: filePath,
				overwrite: "true"
			}
		});

		await this.request.put(uploadResponse.data.href, data);
	}
}
