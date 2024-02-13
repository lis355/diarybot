import _ from "lodash";

function normalizePath(path) {
	return path.replace(/\\/g, "/");
}

export class Path {
	constructor(path) {
		if (path instanceof Path) this.parts = path.parts;
		else this.parts = normalizePath(path).split("/");
	}

	get lastPart() {
		return _.last(this.parts);
	}

	get parentPath() {
		return new Path(this.parts.slice(0, this.parts.length - 1));
	}
}

export class ObjectInfo {
	constructor({ path, isExists, isDirectory, isFile, meta = {} }) {
		this.path = path && normalizePath(path);
		this.isExists = false;
		this.isDirectory = false;
		this.isFile = false;
		this.meta = {};
	}
}

export class DirectoryInfo extends ObjectInfo {
	constructor({ path, meta = {} }) {
		super({ path, isExists: true, isDirectory: true, isFile: false, meta });
	}
}

export class FileInfo extends ObjectInfo {
	constructor({ path, meta = {} }) {
		super({ path, isExists: true, isDirectory: true, isFile: false, meta });
	}
}

export const NONE_OBJECT = new ObjectInfo({ isExists: false });

export class StorageApi {
	async getObjectInfo(path) { }

	async createDirectory(path) { }
	async deleteDirectory(path) { }

	async createOrUpdateFile(path, data) { }
	async readFile(path) { }
	async deleteFile(path) { }
}
