import axios from "axios";
import { StatusCodes } from "http-status-codes";

import { Storage, DirectoryInfo, FileInfo, NONE_OBJECT } from "./Storage.js";
import { Path } from "../../tools/Path.js";
import downloadFile from "../../tools/downloadFile.js";
import logger from "../../tools/logger.js";

export default class YandexDiskApi extends Storage {
	constructor(config) {
		super();

		this.basePath = new Path(config.base);
		this.oauthToken = config.oauthToken;

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

	getAbsolutePath(localPath) {
		return Path.join(this.basePath, localPath);
	}

	async getObjectInfo(path) {
		const strPath = this.getAbsolutePath(path).toString();

		logger.info(`[YandexDiskApi]: getFileInfo ${strPath}`);

		try {
			const response = await this.request.get("resources", {
				params: {
					path: strPath
				}
			});

			const resourceInfo = response.data;
			if (resourceInfo.type === "dir") return new DirectoryInfo({ path, name: path.lastPart, meta: resourceInfo });
			else if (resourceInfo.type === "file") return new FileInfo({ path, name: path.lastPart, meta: resourceInfo });
			else throw new Error(`Unknown type ${resourceInfo.type}`);
		} catch (error) {
			if (error.response &&
				error.response.status === StatusCodes.NOT_FOUND) return NONE_OBJECT;

			throw error;
		}
	}

	async createDirectory(path) {
		const strPath = this.getAbsolutePath(path).toString();

		await this.request.put("resources", null, {
			params: {
				path: strPath
			}
		});
	}

	async ensureDirectory(path) {
		const subFoldersToCreate = [];

		do {
			const info = await this.getObjectInfo(path);
			if (info.isDirectory) break;

			subFoldersToCreate.push(path);
			path = path.parentPath;
		} while (!path.isRoot);

		subFoldersToCreate.reverse();

		for (const path of subFoldersToCreate) await this.createDirectory(path);
	}

	async getDirectoryObjectInfos(path) {
		const directoryInfo = await this.getObjectInfo(path);
		if (!directoryInfo.isDirectory) throw new Error("Not a directory");

		const strPath = this.getAbsolutePath(path).toString();

		logger.info(`[YandexDiskApi]: getDirectoryObjectInfos ${strPath}`);

		const response = await this.request.get("resources", {
			params: {
				path: strPath
			}
		});

		return response.data._embedded.items.map(resourceInfo => {
			if (resourceInfo.type === "dir") return new DirectoryInfo({ path, name: resourceInfo.name, meta: resourceInfo });
			else if (resourceInfo.type === "file") return new FileInfo({ path, name: resourceInfo.name, meta: resourceInfo });
			else throw new Error(`Unknown type ${resourceInfo.type}`);
		});
	}

	async createOrUpdateFile(path, data) {
		const strPath = this.getAbsolutePath(path).toString();

		logger.info(`[YandexDiskApi]: uploadFile ${strPath}`);

		const uploadResponse = await this.request.get("resources/upload", {
			params: {
				path: strPath,
				overwrite: "true"
			}
		});

		await this.request.put(uploadResponse.data.href, data);
	}

	async readFile(path) {
		const fileInfo = await this.getObjectInfo(path);
		if (!fileInfo.isExists) throw new Error(`File ${this.getAbsolutePath(path).toString()} don't exists`);

		const strPath = this.getAbsolutePath(path).toString();

		logger.info(`[YandexDiskApi]: downloadFile ${strPath}`);

		return downloadFile({ url: fileInfo.meta.file });
	}
}
