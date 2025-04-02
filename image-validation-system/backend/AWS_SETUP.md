# AWS S3 Setup Guide

This guide will help you properly configure AWS S3 for the image validation system.

## Prerequisites

1. An AWS account
2. IAM permissions to create S3 buckets and IAM users

## Step 1: Create an S3 Bucket

1. Log in to the AWS Management Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., "your-project-images")
5. Select the region closest to your users (default is us-west-1)
6. Configure the bucket:
   - Block all public access: **Disabled** (we need public read access for images)
   - Bucket versioning: Optional
   - Encryption: Optional
7. Click "Create bucket"

## Step 2: Set Bucket Policy for Public Read Access

1. Select your newly created bucket
2. Go to the "Permissions" tab
3. Under "Bucket policy", click "Edit"
4. Add the following policy (replace `your-bucket-name` with your actual bucket name):

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "PublicReadGetObject",
			"Effect": "Allow",
			"Principal": "*",
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::your-bucket-name/*"
		}
	]
}
```

5. Click "Save changes"

## Step 3: Create IAM User for Application Access

1. Navigate to the IAM service
2. Click "Users" and then "Create user"
3. Enter a username (e.g., "image-upload-app")
4. Set access type: "Programmatic access"
5. Click "Next: Permissions"
6. Select "Attach existing policies directly"
7. Click "Create policy"
8. In the policy editor, enter the following JSON (replace `your-bucket-name` with your actual bucket name):

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "ImageUploadAppPermissions",
			"Effect": "Allow",
			"Action": [
				"s3:PutObject",
				"s3:PutObjectAcl",
				"s3:GetObject",
				"s3:DeleteObject"
			],
			"Resource": [
				"arn:aws:s3:::your-bucket-name",
				"arn:aws:s3:::your-bucket-name/*"
			]
		}
	]
}
```

9. Click "Review policy"
10. Name the policy (e.g., "image-upload-s3-access")
11. Click "Create policy"
12. Go back to user creation, refresh the policy list, and select your newly created policy
13. Click "Next" until you create the user
14. **IMPORTANT:** Save the Access Key ID and Secret Access Key that are displayed. You will only see the Secret Access Key once.

## Step 4: Configure Environment Variables

1. Open the `.env` file in the backend directory
2. Update the following variables:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-west-1
S3_BUCKET_NAME=your-bucket-name
```

3. Save the file

## Step 5: Test S3 Integration

1. Restart your backend server
2. Upload an image using your application
3. Check the console logs for any S3-related errors
4. If successful, you should see the image URL in the format: `https://your-bucket-name.s3.amazonaws.com/image-key`

## Troubleshooting

### Image Upload Fails with Access Denied

- Verify your bucket policy allows public read access
- Check that your IAM user has proper permissions
- Ensure the environment variables are correctly set

### S3 Bucket Not Found

- Verify the bucket name in your environment variables
- Check if the bucket exists in the specified region

### Invalid Credentials

- Verify your AWS access keys are correctly entered in the `.env` file
- Ensure your IAM user is active and has not been deleted

## Security Considerations

- Never commit your AWS credentials to version control
- Consider using IAM roles for EC2 instances in production
- Implement server-side validation for uploaded files
- Consider setting up a CDN like CloudFront for better performance
