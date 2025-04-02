import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { S3Service } from "../services/s3Service";
import {
	ImageValidationService,
	ValidationResult,
} from "../services/imageValidationService";

const prisma = new PrismaClient();
const s3Service = new S3Service();
const imageValidation = new ImageValidationService();

export const uploadImage = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		if (!req.file) {
			res.status(400).json({ error: "No file uploaded" });
			return;
		}

		let fileBuffer = req.file.buffer;
		let mimeType = req.file.mimetype;
		const originalName = req.file.originalname;
		const fileExtension = path.extname(originalName).toLowerCase();

		// Set processing status initially
		let status = "processing";
		let validationErrors: string[] = [];

		// Convert HEIC to JPEG if needed
		let originalFileName = originalName;
		if (
			mimeType === "image/heic" ||
			fileExtension === ".heic" ||
			fileExtension === ".HEIC"
		) {
			try {
				// Convert HEIC to JPEG
				fileBuffer = await imageValidation.convertHeicToJpeg(fileBuffer);
				mimeType = "image/jpeg";

				// Update the filename to reflect the conversion
				const fileNameWithoutExt = originalName.substring(
					0,
					originalName.lastIndexOf(".")
				);
				originalFileName = `${fileNameWithoutExt}.jpg`;
				console.log(`Converted HEIC: ${originalName} -> ${originalFileName}`);
			} catch (error) {
				console.error("HEIC conversion error:", error);
				res.status(400).json({ error: "Failed to convert HEIC image" });
				return;
			}
		}

		// Validate image resolution
		const resolutionResult = await imageValidation.validateResolution(
			fileBuffer
		);
		if (!resolutionResult.isValid) {
			validationErrors.push(resolutionResult.reason || "Invalid resolution");
		}

		// Validate image blur
		const blurResult = await imageValidation.validateBlur(fileBuffer);
		if (!blurResult.isValid) {
			validationErrors.push(blurResult.reason || "Image too blurry");
		}

		console.log("=== STARTING FACE DETECTION ===");
		// Validate faces
		const faceResult = await imageValidation.validateFaces(fileBuffer);
		console.log("Face validation result:", faceResult);
		if (!faceResult.isValid) {
			validationErrors.push(faceResult.reason || "Face validation failed");
		}
		console.log("=== FACE DETECTION COMPLETE ===");

		// Validate similarity
		const similarityResult = await imageValidation.validateSimilarity(
			fileBuffer
		);
		if (!similarityResult.isValid) {
			validationErrors.push(
				similarityResult.reason || "Image too similar to existing one"
			);
		}

		// Determine final status
		if (validationErrors.length > 0) {
			status = "invalid";
		} else {
			status = "valid";
		}

		// Upload all images to S3, even invalid ones
		const s3Upload = await s3Service.uploadFile(fileBuffer, originalFileName);

		// Store image metadata in database
		const image = await prisma.image.create({
			data: {
				filename: s3Upload.key,
				originalName: originalName,
				mimeType: mimeType,
				size: req.file.size,
				url: s3Upload.url,
				s3Key: s3Upload.key,
				storageType: s3Upload.storageType,
				status: status,
				validationErrors:
					validationErrors.length > 0 ? validationErrors.join("; ") : null,
			},
		});

		// Log the storage type for clarity
		console.log(`Image stored using: ${s3Upload.storageType} storage`);

		if (status === "invalid") {
			// Return validation error information but with success=true since we still uploaded the image
			res.status(200).json({
				success: true,
				...image,
				validationErrors: validationErrors,
				storageType: s3Upload.storageType,
				status: "invalid",
			});
		} else {
			res.status(201).json({
				success: true,
				...image,
				validationErrors: null,
				storageType: s3Upload.storageType,
			});
		}
	} catch (error) {
		console.error("Error uploading image:", error);
		// Add more detailed error logging
		if (error instanceof Error) {
			console.error("Error details:", error.message);
			if ("stack" in error) {
				console.error("Stack trace:", error.stack);
			}
		}
		res.status(500).json({
			success: false,
			error: "Failed to upload image",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const getAllImages = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const images = await prisma.image.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		res.status(200).json(images);
	} catch (error) {
		console.error("Error fetching images:", error);
		res.status(500).json({ error: "Failed to fetch images" });
	}
};

export const getImageById = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;

		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			res.status(404).json({ error: "Image not found" });
			return;
		}

		res.status(200).json(image);
	} catch (error) {
		console.error("Error fetching image:", error);
		res.status(500).json({ error: "Failed to fetch image" });
	}
};

export const deleteImage = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;

		// Find the image
		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			res.status(404).json({ error: "Image not found" });
			return;
		}

		// Delete from S3 if it has an S3 key
		if (image.s3Key) {
			await s3Service.deleteFile(image.s3Key);
		}

		// Delete from database
		await prisma.image.delete({
			where: { id },
		});

		res.status(200).json({ message: "Image deleted successfully" });
	} catch (error) {
		console.error("Error deleting image:", error);
		res.status(500).json({ error: "Failed to delete image" });
	}
};
