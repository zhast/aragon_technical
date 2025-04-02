import {
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { s3Client, bucketName } from "../config/s3Config";
import { randomUUID } from "crypto";
import { Readable } from "stream";

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
			ACL: "public-read" as ObjectCannedACL,
		};

		try {
			const command = new PutObjectCommand(params);
			await s3Client.send(command);

			// Construct the URL directly since we're using public-read ACL
			const url = `https://${bucketName}.s3.amazonaws.com/${key}`;

			return {
				url,
				key,
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
