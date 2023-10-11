export default class AsyncQueue {
	constructor(errorHandler) {
		this.__clear();

		this.__errorHandler = errorHandler;
	}

	__clear() {
		this.__queue = [];
	}

	push(asyncFunction) {
		return new Promise(resolve => {
			this.__queue.push({ asyncFunction, resolve });

			this.__process();
		});
	}

	async __process() {
		if (this.__processing ||
			this.__queue.length === 0) return;

		this.__processing = true;

		const { asyncFunction, resolve } = this.__queue.shift();

		try {
			// app.log.info(`start ${asyncFunction.toString()}`);

			resolve(await asyncFunction());
		} catch (error) {
			if (this.__errorHandler) this.__errorHandler(error);
			else console.error(error);
		} finally {
			// app.log.info(`finish ${asyncFunction.toString()}`);
		}

		this.__processing = false;

		this.__process();
	}
};
