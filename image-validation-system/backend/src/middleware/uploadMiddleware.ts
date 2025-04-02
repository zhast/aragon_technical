import multer from "multer";
import multerS3 from "multer-s3";
import { s3, bucketName } from "../config/s3Config";
import { randomUUID } from "crypto";
import path from "path";

// Set up storage with multer-s3
const s3Storage = multerS3({
	s3: s3,
	bucket: bucketName,
	acl: "public-read",
	contentType: multerS3.AUTO_CONTENT_TYPE,
	key: (req, file, cb) => {
		const fileExtension = path.extname(file.originalname).toLowerCase();
		const fileName = `${randomUUID()}${fileExtension}`;
		cb(null, fileName);
	},
});

// For local testing - can be used instead of S3 if needed
const localStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		const fileExtension = path.extname(file.originalname).toLowerCase();
		const fileName = `${randomUUID()}${fileExtension}`;
		cb(null, fileName);
	},
});

// Filter function to validate image file types
const fileFilter = (
	req: Express.Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
) => {
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic"];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only JPEG, PNG, and HEIC formats are allowed."
			)
		);
	}
};

// Create the multer upload middleware with S3 storage
const upload = multer({
	storage: s3Storage, // Use s3Storage for production or localStorage for testing
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max file size
	},
	fileFilter: fileFilter,
});

export default upload;
