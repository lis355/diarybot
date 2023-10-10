import _ from "lodash";
import fs from "fs-extra";
import YAML from "yaml";

export async function createDB({ adapter, defaults = {} }) {
	const lodash = _.runInContext();
	lodash.prototype.write = function () {
		adapter.write(this.value());

		return this;
	};

	return lodash.chain({})
		.defaults(defaults || {})
		.merge(await adapter.read())
		.write();
}

export class Adapter {
	async read() { }
	async write(data) { }
}

export class YAMLFileAdapter extends Adapter {
	constructor(filePath) {
		super();

		this.filePath = filePath;
	}

	async read() {
		let data = {};
		try {
			data = YAML.parse(fs.readFileSync(this.filePath).toString());
		} catch (_) {
		}

		return data;
	}

	async write(data) {
		fs.writeFileSync(this.filePath, YAML.stringify(data));
	}
}
