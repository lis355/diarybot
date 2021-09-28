// const { spawn } = require("child_process");

// const Telegraf = require("telegraf");
// const axios = require("axios");
// var EasyYandexS3 = require("easy-yandex-s3");

// const downloadFile = async function ({ url, filePath }) {
// 	return new Promise(async (resolve, reject) => {
// 		app.fs.ensureDirSync(app.path.dirname(filePath));

// 		const response = await axios.get(url, {
// 			responseType: "stream"
// 		});

// 		response.data.pipe(app.fs.createWriteStream(filePath));

// 		response.data.on("end", resolve);
// 		response.data.on("error", reject);
// 	});
// };

// const executeShellCommand = async ({ cmd, args }) => new Promise(resolve => {
// 	const child = spawn(cmd, args, { shell: true });

// 	child.stdout.on("data", data => console.log(data.toString()));
// 	child.stderr.on("data", data => console.log(data.toString()));

// 	child.on("exit", resolve);
// });

// (async () => {
// 	// var s3 = new EasyYandexS3({
// 	// 	auth: {
// 	// 		accessKeyId: "accessKeyId",
// 	// 		secretAccessKey: "secretAccessKey"
// 	// 	},
// 	// 	Bucket: "bucket-voice",
// 	// 	debug: true // Дебаг в консоли, потом можете удалить в релизе
// 	// });

// 	// var upload = await s3.Upload(
// 	// 	{ path: "./out/14.12.2020 00 26.oga" },
// 	// 	"/voice/"
// 	// );

// 	// try {
// 	// 	const res = await axios.post("https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize", {
// 	// 		"config": {
// 	// 			"specification": {
// 	// 				// "languageCode": "string",
// 	// 				// "model": "string",
// 	// 				// "profanityFilter": "string",
// 	// 				// "audioEncoding": "string",
// 	// 				// "sampleRateHertz": "integer",
// 	// 				// "audioChannelCount": 1
// 	// 			}
// 	// 		},
// 	// 		"audio": {
// 	// 			"uri": BUCKET URI

// 	// 		}
// 	// 	}, {
// 	// 		headers: {
// 	// 			"Authorization": "Api-Key KEY"
// 	// 		}
// 	// 	});

// 	// 	console.log(res);

// 	// 	// createdAt:'2020-12-14T12:38:24Z'
// 	// 	// createdBy:''
// 	// 	// done:false
// 	// 	// id:''
// 	// 	// modifiedAt:'2020-12-14T12:38:24Z'
// 	// } catch (error) {
// 	// 	console.error(error);

// 	// 	return app.quit();
// 	// }

// 	// https://operation.api.cloud.yandex.net/operations/{operationId}

// 	try {
// 		const res = await axios.get("https://operation.api.cloud.yandex.net/operations/<operationId>", {
// 			headers: {
// 				"Authorization": "Api-Key KEY"
// 			}
// 		});

// 		// console.log(res);

// 		if (res.data.done) {
// 			const chunks = res.data.response.chunks;

// 			app.tools.json.save(`out/${chunks[0].alternatives[0].text}.json`, res.data.response);

// 			// todo alternatives c большим confidence
// 			app.fs.writeFileSync("out/phrase.txt", chunks.map(chunk => {
// 				if (chunk.alternatives.length > 1) {
// 					console.log(1);
// 				}

// 				return chunk.alternatives[0].text;
// 			}).join(". "));
// 		}
// 	} catch (error) {
// 		console.error(error);

// 		return app.quit();
// 	}

// 	await executeShellCommand({
// 		cmd: "\"C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe\"",
// 		args: [
// 			"-i",
// 			"\"C:/Programming/JSTests/NodeTests/out/14.12.2020 00 26.oga\"",
// 			"-ac",
// 			"1",
// 			"-y",
// 			"\"C:/Programming/JSTests/NodeTests/out/14.12.2020 00 26.mp3\""
// 		]
// 	});

// Загрузка на яндекс диск
// try {
//     const response = await axios.get("https://cloud-api.yandex.net/v1/disk/resources/upload", {
//         params: {
//             path: "disk:/temp/14.12.2020 00 26.mp3",
//             overwrite: "true"
//         },
//         headers: {
//             "Authorization": "OAuth TOKEN"
//         }
//     });

//     console.log(response.data);

//     const putResponse = await axios.put(response.data.href, fs.createReadStream("./temp/14.12.2020 00 26.mp3"));

//     console.log(putResponse.status);
// } catch (error) {
//     console.error(error);

//     return;
// }
