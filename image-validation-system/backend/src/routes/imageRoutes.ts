import express from "express";
import {
	uploadImage,
	getAllImages,
	getImageById,
	deleteImage,
} from "../controllers/imageController";
import upload from "../middleware/uploadMiddleware";

const router = express.Router();

// Upload a new image
router.post("/upload", upload.single("image"), uploadImage);

// Get all images
router.get("/", getAllImages);

// Get a specific image by ID
router.get("/:id", getImageById);

// Delete an image
router.delete("/:id", deleteImage);

export default router;
