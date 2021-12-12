const executeShellCommand = require("./executeShellCommand");

module.exports = async function convertAudioFile(fromAudioFilePath, toAudioFilePath) {
	await executeShellCommand({ cmd: `"${process.env.FFMPEG_PATH}" -i "${fromAudioFilePath}" -ac 1 "${toAudioFilePath}"` });
};
