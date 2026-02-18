import fs from 'node:fs';
import { URL } from 'node:url';
import https from 'node:https';

/**
 * Upload a file to S3.
 *
 * @param url
 * @param filePath
 * @param maxRetries
 */
export async function uploadToS3(url: string, filePath: string, maxRetries = 3) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			await new Promise((resolve, reject) => {
				const fileStats = fs.statSync(filePath);
				const fileStream = fs.createReadStream(filePath);
				const urlObj = new URL(url);
				const options = {
					hostname: urlObj.hostname,
					path: urlObj.pathname + urlObj.search,
					method: 'PUT',
					headers: {
						'Content-Type': 'application/octet-stream',
						'Content-Length': fileStats.size
					}
				};
				const req = https.request(options, (res) => {
					if (res.statusCode === 200) {
						return resolve(true);
					}

					reject(new Error(`Upload failed: ${res.statusCode}`));
				});
				req.on('error', reject);
				fileStream.pipe(req);
			});
			return; // Success
		} catch (error) {
			if (attempt === maxRetries) throw error;
			await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
		}
	}
}
