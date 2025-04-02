import {
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, bucketName } from "../config/s3Config";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

/**
 * Service for handling S3 operations
 */
export class S3Service {
	/**
	 * Upload a file to S3
	 * @param file The file buffer to upload
	 * @param fileName Original filename (used to determine content type)
	 * @returns Object containing the S3 URL and key
	 */
	async uploadFile(
		file: Buffer,
		fileName: string
	): Promise<{ url: string; key: string; storageType: string }> {
		const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
		const contentType = this.getContentType(fileExtension);
		const key = `${randomUUID()}.${fileExtension}`;

		// Ensure uploads directory exists for fallback
		this.ensureUploadsDirectoryExists();

		const params = {
			Bucket: bucketName,
			Key: key,
			Body: file,
			ContentType: contentType,
		};

		try {
			console.log("\n=== S3 UPLOAD ATTEMPT ===");
			console.log("Bucket:", params.Bucket);
			console.log("Region:", process.env.AWS_REGION || "default");
			console.log("File:", fileName, "->", key);

			// Check if we have the required credentials before attempting to upload
			if (
				!process.env.AWS_ACCESS_KEY_ID ||
				!process.env.AWS_SECRET_ACCESS_KEY
			) {
				throw new Error(
					"AWS credentials not configured. Using local fallback."
				);
			}

			const command = new PutObjectCommand(params);
			await s3Client.send(command);

			// Construct the URL using virtual-hosted style format
			const region = process.env.AWS_REGION || "us-west-1";
			const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
			console.log("\n✅ S3 UPLOAD SUCCESSFUL");
			console.log("S3 URL:", url);

			return {
				url,
				key,
				storageType: "s3",
			};
		} catch (error) {
			console.error("\n❌ S3 UPLOAD FAILED");

			if (error instanceof Error) {
				console.error("Error details:", error.message);

				// Check for specific AWS errors
				if (error.message.includes("AccessDenied")) {
					console.error("S3 access denied - check your AWS IAM permissions");
				} else if (error.message.includes("InvalidAccessKeyId")) {
					console.error(
						"Invalid AWS access key - check your AWS_ACCESS_KEY_ID"
					);
				} else if (error.message.includes("SignatureDoesNotMatch")) {
					console.error(
						"AWS signature mismatch - check your AWS_SECRET_ACCESS_KEY"
					);
				} else if (error.message.includes("NoSuchBucket")) {
					console.error(
						`Bucket "${bucketName}" does not exist - check your S3_BUCKET_NAME`
					);
				}

				if ("$metadata" in error) {
					console.error("AWS response metadata:", (error as any).$metadata);
				}
			}

			// Fallback to local storage if S3 fails
			try {
				console.log("\n⚠️ USING LOCAL STORAGE FALLBACK");
				const localFilePath = await this.saveFileLocally(file, fileExtension);

				const port = process.env.PORT || 3001;
				const localUrl = `http://localhost:${port}/uploads/${localFilePath}`;

				console.log("Local file saved at:", localFilePath);
				console.log("Local URL:", localUrl);

				return {
					url: localUrl,
					key: localFilePath,
					storageType: "local",
				};
			} catch (localError) {
				console.error("\n❌ LOCAL STORAGE FALLBACK FAILED");
				console.error(
					"Error:",
					localError instanceof Error ? localError.message : localError
				);
				throw new Error("Failed to upload file to S3 and local fallback");
			}
		}
	}

	/**
	 * Ensure the uploads directory exists
	 */
	private ensureUploadsDirectoryExists(): void {
		const uploadsDir = path.join(__dirname, "../../uploads");
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true });
			console.log(`Created uploads directory at ${uploadsDir}`);
		}
	}

	/**
	 * Save file to local filesystem as fallback
	 * @param file File buffer
	 * @param extension File extension
	 * @returns Local file path
	 */
	private async saveFileLocally(
		file: Buffer,
		extension: string
	): Promise<string> {
		const fileName = `${randomUUID()}.${extension}`;
		const uploadsDir = path.join(__dirname, "../../uploads");
		const filePath = path.join(uploadsDir, fileName);

		await fs.promises.writeFile(filePath, file);
		return fileName;
	}

	/**
	 * Get a file from S3
	 * @param key The key of the file in S3
	 * @returns The file data
	 */
	async getFile(key: string): Promise<Buffer> {
		const params = {
			Bucket: bucketName,
			Key: key,
		};

		try {
			const command = new GetObjectCommand(params);
			const response = await s3Client.send(command);

			// Convert stream to buffer
			if (response.Body) {
				const stream = response.Body as Readable;
				return await this.streamToBuffer(stream);
			}
			throw new Error("Empty response body");
		} catch (error) {
			console.error("Error retrieving file from S3:", error);
			throw new Error("Failed to retrieve file from S3");
		}
	}

	/**
	 * Delete a file from S3
	 * @param key The key of the file in S3
	 */
	async deleteFile(key: string): Promise<void> {
		const params = {
			Bucket: bucketName,
			Key: key,
		};

		try {
			const command = new DeleteObjectCommand(params);
			await s3Client.send(command);
		} catch (error) {
			console.error("Error deleting file from S3:", error);
			throw new Error("Failed to delete file from S3");
		}
	}

	/**
	 * Helper method to convert a stream to a buffer
	 * @param stream The readable stream to convert
	 * @returns Promise that resolves to a Buffer
	 */
	private async streamToBuffer(stream: Readable): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = [];
			stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
			stream.on("end", () => resolve(Buffer.concat(chunks)));
			stream.on("error", reject);
		});
	}

	/**
	 * Get the appropriate content type based on file extension
	 * @param extension File extension
	 * @returns Content type string
	 */
	private getContentType(extension: string): string {
		const contentTypes: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			heic: "image/heic",
		};

		return contentTypes[extension] || "application/octet-stream";
	}
}
