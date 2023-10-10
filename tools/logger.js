import pino from "pino";

export default pino(
	pino.transport({
		targets: [
			{
				target: "pino-pretty",
				level: "trace",
				options: {
					colorize: true,
					ignore: "pid,hostname"
				}
			}
		]
	}),
	pino.destination({
		sync: true
	})
);
