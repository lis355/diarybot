const { spawn } = require("child_process");

module.exports = async function executeShellCommand({ cmd, args }) {
	return new Promise(resolve => {
		const child = spawn(cmd, args, { shell: true });

		child.stdout.on("data", data => console.log(data.toString()));
		child.stderr.on("data", data => console.log(data.toString()));

		child.on("exit", resolve);
	});
};
