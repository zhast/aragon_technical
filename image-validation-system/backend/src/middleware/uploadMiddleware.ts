import multer from "multer";
import path from "path";

// Filter function to validate image file types
const fileFilter = (
	req: Express.Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
) => {
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic"];
	const allowedExtensions = [".jpg", ".jpeg", ".png", ".heic", ".HEIC"];
	const fileExtension = path.extname(file.originalname).toLowerCase();

	// Check both mimetype and file extension
	if (
		allowedTypes.includes(file.mimetype) ||
		allowedExtensions.includes(fileExtension)
	) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only JPEG, PNG, and HEIC formats are allowed."
			)
		);
	}
};

// Create multer upload middleware with memory storage for processing
const upload = multer({
	storage: multer.memoryStorage(), // Use memory storage to process before S3 upload
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max file size
	},
	fileFilter: fileFilter,
});

export default upload;
