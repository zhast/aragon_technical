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
		if (
			mimeType === "image/heic" ||
			fileExtension === ".heic" ||
			fileExtension === ".HEIC"
		) {
			try {
				// For now, just reject HEIC files until we can get heic-convert working properly
				validationErrors.push("HEIC conversion not supported in this version");
				status = "invalid";
				// fileBuffer = await imageValidation.convertHeicToJpeg(fileBuffer);
				// mimeType = "image/jpeg";
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

		// Face detection is disabled for now until we properly set up AWS credentials
		/*
		const faceResult = await imageValidation.validateFaces(fileBuffer);
		if (!faceResult.isValid) {
			validationErrors.push(faceResult.reason || "Face validation failed");
		}
		*/

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

		// Upload file to S3
		const s3Upload = await s3Service.uploadFile(
			fileBuffer,
			status === "valid" ? originalName : `invalid_${originalName}`
		);

		// Store image metadata in database
		const image = await prisma.image.create({
			data: {
				filename: s3Upload.key,
				originalName: originalName,
				mimeType: mimeType,
				size: req.file.size,
				url: s3Upload.url,
				status: status,
				s3Key: s3Upload.key,
				validationErrors:
					validationErrors.length > 0 ? validationErrors.join("; ") : null,
			},
		});

		res.status(201).json({
			...image,
			validationErrors: validationErrors,
		});
	} catch (error) {
		console.error("Error uploading image:", error);
		res.status(500).json({ error: "Failed to upload image" });
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
