import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { S3Service } from "../services/s3Service";

const prisma = new PrismaClient();
const s3Service = new S3Service();

export const uploadImage = async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		// Basic file validation (handled by upload middleware)
		// Upload file to S3
		const s3Upload = await s3Service.uploadFile(
			req.file.buffer,
			req.file.originalname
		);

		// Store image metadata in database
		const image = await prisma.image.create({
			data: {
				filename: s3Upload.key,
				originalName: req.file.originalname,
				mimeType: req.file.mimetype,
				size: req.file.size,
				url: s3Upload.url,
				status: "valid", // For MVP we'll set as valid immediately
				s3Key: s3Upload.key,
			},
		});

		return res.status(201).json(image);
	} catch (error) {
		console.error("Error uploading image:", error);
		return res.status(500).json({ error: "Failed to upload image" });
	}
};

export const getAllImages = async (req: Request, res: Response) => {
	try {
		const images = await prisma.image.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		return res.status(200).json(images);
	} catch (error) {
		console.error("Error fetching images:", error);
		return res.status(500).json({ error: "Failed to fetch images" });
	}
};

export const getImageById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			return res.status(404).json({ error: "Image not found" });
		}

		return res.status(200).json(image);
	} catch (error) {
		console.error("Error fetching image:", error);
		return res.status(500).json({ error: "Failed to fetch image" });
	}
};

export const deleteImage = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		// Find the image
		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			return res.status(404).json({ error: "Image not found" });
		}

		// Delete from S3 if it has an S3 key
		if (image.s3Key) {
			await s3Service.deleteFile(image.s3Key);
		}

		// Delete from database
		await prisma.image.delete({
			where: { id },
		});

		return res.status(200).json({ message: "Image deleted successfully" });
	} catch (error) {
		console.error("Error deleting image:", error);
		return res.status(500).json({ error: "Failed to delete image" });
	}
};
