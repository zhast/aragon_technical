import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS SDK
AWS.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION || "us-east-1",
});

// Create S3 instance
const s3 = new AWS.S3();

// Bucket name from environment variables
const bucketName = process.env.AWS_S3_BUCKET_NAME || "image-validation-system";

export { s3, bucketName };
