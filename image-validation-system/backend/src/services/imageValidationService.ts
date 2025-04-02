import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import {
	RekognitionClient,
	DetectFacesCommand,
} from "@aws-sdk/client-rekognition";
import heicConvert from "heic-convert";

const prisma = new PrismaClient();
const rekognition = new RekognitionClient({
	region: process.env.AWS_REGION || "us-east-1",
});

export interface ValidationResult {
	isValid: boolean;
	reason?: string;
}

export class ImageValidationService {
	/**
	 * Validate image resolution
	 * @param buffer Image buffer
	 * @returns ValidationResult with resolution check result
	 */
	async validateResolution(buffer: Buffer): Promise<ValidationResult> {
		try {
			const metadata = await sharp(buffer).metadata();
			const minWidth = 800;
			const minHeight = 600;

			if (!metadata.width || !metadata.height) {
				return {
					isValid: false,
					reason: "We couldn't process this image",
				};
			}

			if (metadata.width < minWidth || metadata.height < minHeight) {
				return {
					isValid: false,
					reason: "Image is too small - please upload a larger photo",
				};
			}

			return { isValid: true };
		} catch (error) {
			console.error("Error validating image resolution:", error);
			return { isValid: false, reason: "We couldn't process this image" };
		}
	}

	/**
	 * Validate if image is too blurry
	 * @param buffer Image buffer
	 * @returns ValidationResult with blur check result
	 */
	async validateBlur(buffer: Buffer): Promise<ValidationResult> {
		try {
			// Convert to grayscale for better blur detection
			const grayscale = sharp(buffer).grayscale();

			// Calculate the Laplacian variance (measure of sharpness)
			const { data, info } = await grayscale
				.raw()
				.toBuffer({ resolveWithObject: true });

			// Laplacian filter for edge detection
			const laplacian = await this.calculateLaplacianVariance(
				data,
				info.width,
				info.height
			);

			// Define threshold for blur detection (may need tuning)
			const blurThreshold = 20;

			if (laplacian < blurThreshold) {
				return {
					isValid: false,
					reason: "Photo is too blurry - please upload a clearer image",
				};
			}

			return { isValid: true };
		} catch (error) {
			console.error("Error validating image blur:", error);
			return { isValid: false, reason: "We couldn't process this image" };
		}
	}

	/**
	 * Calculate Laplacian variance for blur detection
	 * @param data Raw image data
	 * @param width Image width
	 * @param height Image height
	 * @returns Laplacian variance value
	 */
	private calculateLaplacianVariance(
		data: Buffer,
		width: number,
		height: number
	): number {
		// Simple Laplacian kernel [0, 1, 0, 1, -4, 1, 0, 1, 0]
		const laplacianValues: number[] = [];

		// Skip the borders (1 pixel) for simplicity
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				const index = y * width + x;

				// Apply Laplacian filter
				const val =
					-4 * data[index] +
					data[index - 1] +
					data[index + 1] +
					data[index - width] +
					data[index + width];

				laplacianValues.push(Math.abs(val));
			}
		}

		// Calculate variance
		if (laplacianValues.length === 0) return 0;

		const sum = laplacianValues.reduce((acc, val) => acc + val, 0);
		const mean = sum / laplacianValues.length;

		const variance =
			laplacianValues.reduce((acc, val) => {
				const diff = val - mean;
				return acc + diff * diff;
			}, 0) / laplacianValues.length;

		return variance;
	}

	/**
	 * Validate face detection in image
	 * @param buffer Image buffer
	 * @returns ValidationResult with face detection result
	 */
	async validateFaces(buffer: Buffer): Promise<ValidationResult> {
		try {
			console.log("Starting face detection validation...");
			const params = {
				Image: {
					Bytes: buffer,
				},
				// Using default attributes without specifying Attributes array
			};

			console.log("Sending request to AWS Rekognition...");
			const command = new DetectFacesCommand(params);
			const response = await rekognition.send(command);

			console.log(
				"Rekognition response received:",
				JSON.stringify(response, null, 2)
			);

			if (!response.FaceDetails || response.FaceDetails.length === 0) {
				console.log("No faces detected in the image");
				return { isValid: false, reason: "No face detected in photo" };
			}

			if (response.FaceDetails.length > 1) {
				console.log(`Multiple faces detected: ${response.FaceDetails.length}`);
				return {
					isValid: false,
					reason:
						"Multiple faces detected - please use a photo with just one person",
				};
			}

			// Check face size (using bounding box)
			const face = response.FaceDetails[0];
			const boundingBox = face.BoundingBox;
			const faceSize = boundingBox
				? (boundingBox.Width || 0) * (boundingBox.Height || 0)
				: 0;

			console.log(`Face bounding box: ${JSON.stringify(boundingBox)}`);
			console.log(`Face size proportion: ${faceSize}, threshold: 0.05`);

			if (boundingBox && faceSize < 0.05) {
				console.log("Face is too small in the image");
				return {
					isValid: false,
					reason: "Face is too small - please use a closer photo",
				};
			}

			console.log("Face validation passed");
			return { isValid: true };
		} catch (error) {
			console.error("Error validating faces in image:", error);
			return {
				isValid: false,
				reason: "We couldn't analyze faces in the image",
			};
		}
	}

	/**
	 * Convert HEIC image to JPEG
	 * @param buffer HEIC image buffer
	 * @returns JPEG buffer
	 */
	async convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
		try {
			console.log("Starting HEIC to JPEG conversion...");
			const result = await heicConvert({
				buffer,
				format: "JPEG",
				quality: 90,
			});
			console.log("HEIC conversion successful - output size:", result.length);
			return result;
		} catch (error) {
			console.error("Error converting HEIC to JPEG:", error);
			if (error instanceof Error) {
				console.error("Error details:", error.message);
				console.error("Error stack:", error.stack);
			}
			throw new Error("Failed to convert HEIC image to JPEG");
		}
	}

	/**
	 * Check if image is similar to existing ones
	 * @param buffer Image buffer
	 * @returns ValidationResult with similarity check result
	 */
	async validateSimilarity(buffer: Buffer): Promise<ValidationResult> {
		// For demonstration purposes, a simple hash-based approach
		// In production, consider using a proper perceptual hash algorithm
		// or a cloud service like AWS Rekognition's CompareFaces

		try {
			// Generate a simple hash of the image
			const imageHash = await this.generateSimpleHash(buffer);

			// Get hashes of recent images from database (would require a hash field in schema)
			// This is simplified for demo purposes
			// const recentImages = await prisma.image.findMany({
			//   take: 20,
			//   orderBy: {
			//     createdAt: 'desc'
			//   },
			//   where: {
			//     status: 'valid'
			//   }
			// });

			// Check similarity (would compare hashes in real implementation)
			// const isSimilar = recentImages.some(img =>
			//   this.calculateHashSimilarity(imageHash, img.hash) > 0.8
			// );

			// if (isSimilar) {
			//   return { isValid: false, reason: 'This photo looks too similar to one you already uploaded' };
			// }

			return { isValid: true };
		} catch (error) {
			console.error("Error checking image similarity:", error);
			return { isValid: false, reason: "We couldn't process this image" };
		}
	}

	/**
	 * Generate a simple hash for an image (for demo purposes)
	 * @param buffer Image buffer
	 * @returns Simple image hash
	 */
	private async generateSimpleHash(buffer: Buffer): Promise<string> {
		try {
			// Resize to small dimensions for consistent hashing
			const resized = await sharp(buffer)
				.resize(8, 8, { fit: "fill" })
				.grayscale()
				.raw()
				.toBuffer();

			// Convert to binary string based on average value
			const avg = resized.reduce((sum, val) => sum + val, 0) / resized.length;
			let hash = "";

			for (const pixel of resized) {
				hash += pixel > avg ? "1" : "0";
			}

			return hash;
		} catch (error) {
			console.error("Error generating image hash:", error);
			throw new Error("Failed to generate image hash");
		}
	}
}
