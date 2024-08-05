import { Storage, DirectoryInfo, FileInfo, NONE_OBJECT } from "./Storage.js";
import { Path } from "../../tools/Path.js";
import fs from "fs-extra";

export default class LocalDiskStorage extends Storage {
	constructor(config) {
		super();

		this.basePath = new Path(config.base);
	}

	getAbsolutePath(localPath) {
		return Path.join(this.basePath, localPath);
	}

	async getObjectInfo(path) {
		const strPath = this.getAbsolutePath(path).toString();
		if (!fs.existsSync(strPath)) return NONE_OBJECT;

		const stat = fs.statSync(strPath);

		const name = path.lastPart;
		if (stat.isDirectory()) return new DirectoryInfo({ path, name, meta: stat });
		else if (stat.isFile()) return new FileInfo({ path, name, meta: stat });
		else throw new Error("Unknown stat");
	}

	async createDirectory(path) {
		const strPath = this.getAbsolutePath(path).toString();
		fs.mkdirSync(strPath);
	}

	async ensureDirectory(path) {
		const strPath = this.getAbsolutePath(path).toString();
		if (!fs.existsSync(strPath)) await this.createDirectory(path);
	}

	async getDirectoryObjectInfos(path) {
		const directoryInfo = await this.getObjectInfo(path);
		if (!directoryInfo.isDirectory) throw new Error("Not a directory");

		const strPath = this.getAbsolutePath(path).toString();

		const names = fs.readdirSync(strPath);

		return Promise.all(names.map(async name => this.getObjectInfo(Path.join(path, name))));
	}

	async createOrUpdateFile(path, data) {
		fs.writeFileSync(this.getAbsolutePath(path).toString(), data);
	}

	async readFile(path) {
		return fs.readFileSync(this.getAbsolutePath(path).toString());
	}
}
