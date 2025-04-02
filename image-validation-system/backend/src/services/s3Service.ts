import { s3, bucketName } from "../config/s3Config";
import { randomUUID } from "crypto";

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
	): Promise<{ url: string; key: string }> {
		const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
		const contentType = this.getContentType(fileExtension);
		const key = `${randomUUID()}.${fileExtension}`;

		const params = {
			Bucket: bucketName,
			Key: key,
			Body: file,
			ContentType: contentType,
			ACL: "public-read",
		};

		try {
			const data = await s3.upload(params).promise();
			return {
				url: data.Location,
				key: data.Key,
			};
		} catch (error) {
			console.error("Error uploading file to S3:", error);
			throw new Error("Failed to upload file to S3");
		}
	}

	/**
	 * Get a file from S3
	 * @param key The key of the file in S3
	 * @returns The file data
	 */
	async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
		const params = {
			Bucket: bucketName,
			Key: key,
		};

		try {
			return await s3.getObject(params).promise();
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
			await s3.deleteObject(params).promise();
		} catch (error) {
			console.error("Error deleting file from S3:", error);
			throw new Error("Failed to delete file from S3");
		}
	}

	/**
	 * Get content type based on file extension
	 * @param extension File extension
	 * @returns Content type
	 */
	private getContentType(extension: string): string {
		const contentTypes: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			heic: "image/heic",
		};

		return contentTypes[extension] || "application/octet-stream";
	}
}
