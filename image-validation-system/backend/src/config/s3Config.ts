import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Check for required environment variables
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION || "us-east-1";
const bucketName = process.env.AWS_S3_BUCKET_NAME;

// Log configuration status without exposing secret values
if (!awsAccessKeyId || !awsSecretAccessKey) {
	console.warn(
		"AWS credentials are missing or incomplete. S3 operations will fail."
	);
}

if (!bucketName) {
	console.warn("AWS_S3_BUCKET_NAME is not set. Using default bucket name.");
}

// Create S3 client with AWS SDK v3
const s3Client = new S3Client({
	region: awsRegion,
	credentials: {
		accessKeyId: awsAccessKeyId || "",
		secretAccessKey: awsSecretAccessKey || "",
	},
	forcePathStyle: false, // Use virtual-hosted style URLs
});

// Use environment variable with fallback
const s3BucketName = bucketName || "aragon-technical-photos";

export { s3Client, s3BucketName as bucketName };
