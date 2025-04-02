import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Create S3 client with AWS SDK v3
const s3Client = new S3Client({
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

// Bucket name from environment variables
const bucketName = process.env.AWS_S3_BUCKET_NAME || "image-validation-system";

export { s3Client, bucketName };
