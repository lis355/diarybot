module.exports = async function downloadFile({ axiosInstance, url, filePath }) {
	return new Promise(async (resolve, reject) => {
		axiosInstance = axiosInstance || app.libs.axios;

		const response = await axiosInstance.get(url, {
			responseType: "stream"
		});

		app.fs.ensureDirSync(app.path.dirname(filePath));

		const stream = app.fs.createWriteStream(filePath);
		stream.on("finish", resolve);

		response.data.pipe(stream);
		response.data.on("error", reject);
	});
};
