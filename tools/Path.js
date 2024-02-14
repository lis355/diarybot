import _ from "lodash";

const PATH_SEPARATOR = "/";

function cloneArray(arr) {
	return arr.slice();
}

function normalizePath(path) {
	return path.replace(/\\/g, PATH_SEPARATOR);
}

export class Path {
	constructor(path) {
		if (path instanceof Path) this.parts = cloneArray(path.parts);
		else if (Array.isArray(path)) this.parts = cloneArray(path);
		else if (typeof path === "string") this.parts = normalizePath(path).split(PATH_SEPARATOR);
		else if (!path) this.parts = [];
		else throw new Error("Bad argument");
	}

	static join() {
		return new Path(_.flatten(Array.from(arguments).map(path => new Path(path).parts)));
	}

	get lastPart() {
		return _.last(this.parts);
	}

	get parentPath() {
		return new Path(this.parts.slice(0, this.parts.length - 1));
	}

	get isRoot() {
		return this.parts.length === 0;
	}

	toString() {
		return this.parts.join(PATH_SEPARATOR);
	}
}
