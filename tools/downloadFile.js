module.exports = async function downloadFile({ url, filePath }) {
	return new Promise(async (resolve, reject) => {
		app.fs.ensureDirSync(app.path.dirname(filePath));

		const response = await app.libs.axios.get(url, {
			responseType: "stream"
		});

		response.data.pipe(app.fs.createWriteStream(filePath));

		response.data.on("end", resolve);
		response.data.on("error", reject);
	});
};
