export class ObjectInfo {
	constructor({ path, name, isExists, isDirectory, isFile, meta = {} }) {
		this.path = path;
		this.name = name;
		this.isExists = isExists;
		this.isDirectory = isDirectory;
		this.isFile = isFile;
		this.meta = meta;
	}
}

export class DirectoryInfo extends ObjectInfo {
	constructor({ path, name, meta = {} }) {
		super({ path, name, isExists: true, isDirectory: true, isFile: false, meta });
	}
}

export class FileInfo extends ObjectInfo {
	constructor({ path, name, meta = {} }) {
		super({ path, name, isExists: true, isDirectory: true, isFile: false, meta });
	}
}

export const NONE_OBJECT = new ObjectInfo({ isExists: false });

export class Storage {
	async getObjectInfo(path) { }

	async createDirectory(path) { }
	async ensureDirectory(path) { }
	async deleteDirectory(path) { }

	async getDirectoryObjectInfos(path) { }

	async createOrUpdateFile(path, data) { }
	async readFile(path) { }
	async deleteFile(path) { }
}
