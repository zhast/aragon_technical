import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Temporary local storage directory (will be replaced with S3 in full implementation)
const uploadDir = path.join(__dirname, "../../uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadImage = async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		// Basic file validation (to be expanded later)
		const allowedTypes = ["image/jpeg", "image/png", "image/heic"];
		if (!allowedTypes.includes(req.file.mimetype)) {
			return res.status(400).json({
				error:
					"Invalid file type. Only JPEG, PNG, and HEIC images are allowed.",
			});
		}

		// Save file to local storage (temporary solution, will use S3 later)
		const uniqueFilename = `${uuidv4()}${path.extname(req.file.originalname)}`;
		const filePath = path.join(uploadDir, uniqueFilename);

		// Create a writable stream to save the file
		fs.writeFileSync(filePath, req.file.buffer);

		// Store image metadata in database
		const image = await prisma.image.create({
			data: {
				filename: uniqueFilename,
				originalName: req.file.originalname,
				mimeType: req.file.mimetype,
				size: req.file.size,
				url: `/uploads/${uniqueFilename}`, // This will be S3 URL later
				status: "valid", // For MVP we'll set as valid immediately
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
