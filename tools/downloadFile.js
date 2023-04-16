const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");

module.exports = async function downloadFile({ axiosInstance, url, filePath }) {
	return new Promise(async (resolve, reject) => {
		axiosInstance = axiosInstance || axios;

		const response = await axiosInstance.get(url, {
			responseType: "stream"
		});

		fs.ensureDirSync(path.dirname(filePath));

		const stream = fs.createWriteStream(filePath);
		stream.on("finish", resolve);

		response.data.pipe(stream);
		response.data.on("error", reject);
	});
};
