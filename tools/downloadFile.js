const path = require("path");

const fs = require("fs-extra");
const axios = require("axios");

module.exports = async function downloadFile({ axiosInstance, url, filePath = undefined }) {
	axiosInstance = axiosInstance || axios;

	const response = await axiosInstance.get(url, {
		responseType: "arraybuffer"
	});

	const buffer = response.data;

	if (!filePath) return buffer;

	fs.ensureDirSync(path.dirname(filePath));
	fs.writeFileSync(filePath, buffer);

	return filePath;
};
