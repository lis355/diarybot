import path from "node:path";

import fs from "fs-extra";
import axios from "axios";

export default async function downloadFile({ axiosInstance, url, filePath = undefined }) {
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
