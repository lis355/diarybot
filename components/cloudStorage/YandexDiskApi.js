import path from "node:path";

import axios from "axios";
import { StatusCodes } from "http-status-codes";

import CloudStorageApi from "./CloudStorageApi.js";
import downloadFile from "../../tools/downloadFile.js";
import logger from "../../tools/logger.js";

const BASE_DIRECTORY = "/";

function normalizePath(path) {
	return path.replace(/\\/g, "/");
}

export default class YandexDiskApi extends CloudStorageApi {
	constructor(oauthToken) {
		super();

		this.oauthToken = oauthToken;

		this.request = axios.create({
			baseURL: "https://cloud-api.yandex.net/v1/disk/",
			headers: {
				"authorization": `OAuth ${this.oauthToken}`
			}
		});

		// TODO check and watch for auth
		// this.request.interceptors.response.use(response => {
		// 	this.authorized = true;

		// 	return response;
		// }, error => {
		// 	if (error.name === "AxiosError" &&
		// 		error.response) {
		// 		if (error.response.status === StatusCodes.UNAUTHORIZED) this.authorized = false;
		// 	}

		// 	return Promise.reject(error);
		// });
	}

	// async checkAuth() {
	// 	const response = await this.request.get();
	// 	const data = response.data;

	// 	return Boolean(data.user.login);
	// }

	async getObjectInfo(filePath) {
		filePath = normalizePath(filePath);

		logger.info(`[YandexDiskApi]: getFileInfo ${filePath}`);

		const info = {
			filePath,
			exists: false,
			isFile: false,
			isDirectory: false,
			meta: {}
		};

		try {
			const response = await this.request.get("resources", {
				params: {
					path: filePath
				}
			});

			const resourceInfo = response.data;

			info.exists = true;
			info.isFile = resourceInfo.type === "file";
			info.isDirectory = resourceInfo.type === "dir";
			info.meta = resourceInfo;
		} catch (error) {
			if (error.response &&
				error.response.status === StatusCodes.NOT_FOUND) return info;

			throw error;
		}

		return info;
	}

	async createDirectory(directory) {
		directory = normalizePath(directory);

		await this.request.put("resources", null, {
			params: {
				path: directory
			}
		});
	}

	async ensureDirectory(directory) {
		directory = normalizePath(directory);

		const subFoldersToCreate = [];

		do {
			const info = await this.getObjectInfo(directory);
			if (info.isDirectory) break;

			subFoldersToCreate.push(directory);
			directory = path.dirname(directory);
		} while (directory !== BASE_DIRECTORY);

		subFoldersToCreate.reverse();

		for (const directory of subFoldersToCreate) await this.createDirectory(directory);
	}

	async downloadFile(fileInfo) {
		logger.info(`[YandexDiskApi]: downloadFile ${fileInfo.filePath}`);

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
