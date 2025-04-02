import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import imageRoutes from "./routes/imageRoutes";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist (for fallback to local storage)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory (only if not using S3)
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/images", imageRoutes);

// Basic error handling middleware
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error(err.stack);
		res.status(500).json({ error: err.message || "Something went wrong!" });
	}
);

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// Handle shutdown gracefully
process.on("SIGINT", async () => {
	await prisma.$disconnect();
	console.log("Server shutdown");
	process.exit(0);
});

export default app;
