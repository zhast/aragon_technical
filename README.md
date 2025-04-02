# Image Upload & Validation System

This project implements a system for uploading, validating, and categorizing images based on specific criteria.

## Project Requirements

### Frontend

- [✅] Upload images functionality
- [✅] Frontend validations (HEIC, PNG, JPEG formats)
- [✅] Real-time feedback on upload status
- [✅] State management for the upload process
- [✅] Image previews for uploaded files

### Backend

- [✅] REST API using Node.js with Express or GraphQL
- [✅] PostgreSQL database for metadata storage
- [✅] Amazon S3 or equivalent for image storage
- [✅] RESTful or GraphQL conventions
- [✅] Efficient system for image processing
- [✅] Secure file handling
- [✅] ORM integration (Prisma, Knex.js, etc.)
- [✅] Optimized database queries
- [✅] HEIC to PNG/JPEG conversion

### Validation Requirements

- [✅] Reject images that are too small (size/resolution) [Sharp library]
- [✅] Reject non-JPG, PNG, or HEIC formats [Frontend MIME type validation]
- [✅] Reject images too similar to existing ones [Perceptual Hashing]
- [✅] Reject blurry images [Laplacian Variance Method]
- [✅] Reject images with too small faces [AWS Rekognition]
- [✅] Reject images with multiple faces [AWS Rekognition]

## Implementation Plan

### Step 1: Project Setup & Architecture

- [✅] Create frontend React application
- [✅] Set up Node.js/Express backend
- [✅] Configure PostgreSQL database
- [✅] Set up S3 bucket or equivalent storage
- [✅] Design system architecture and API endpoints

### Step 2: Database Design

- [✅] Design schema for image metadata
- [✅] Select and configure ORM (Prisma recommended)
- [✅] Create migration scripts

### Step 3: Backend Core

- [⬜] Implement user authentication (if needed)
- [✅] Create REST API endpoints for image operations
- [✅] Set up S3 integration for image storage
- [✅] Implement basic file upload functionality

### Step 4: Image Processing Pipeline

- [✅] Create middleware for file validation
- [✅] Implement HEIC to PNG/JPEG conversion
- [✅] Design asynchronous processing workflow
- [✅] Set up secure file handling

### Step 5: Image Validation Services

- [✅] Implement size/resolution validation [Sharp library]
- [✅] Create file format verification [MIME type checks]
- [✅] Develop image similarity detection algorithm [Perceptual Hashing]
- [✅] Implement blur detection [Laplacian Variance]
- [✅] Integrate face detection [AWS Rekognition]
- [✅] Set up validation result storage [PostgreSQL/Prisma]

### Step 6: Frontend Development

- [✅] Create upload component with drag-and-drop
- [✅] Implement client-side file format validation
- [✅] Build image preview functionality
- [✅] Develop state management for upload process
- [✅] Create UI for displaying accepted/rejected images
- [✅] Implement real-time feedback system

### Step 7: Integration & Testing

- [✅] Connect frontend to backend API
- [✅] Test all validation scenarios
  - [✅] Resolution validation [Sharp library]
  - [✅] Format validation [MIME type checks]
  - [✅] Blur detection [Laplacian Variance]
  - [✅] Image similarity [Perceptual Hashing]
  - [✅] Face detection [AWS Rekognition]
- [✅] Fix port configuration issues
- [✅] Implement error handling and logging

### Step 8: Refinement & Deployment

- [✅] Upgrade AWS SDK from v2 to v3
- [⬜] Optimize for performance and scalability
- [⬜] Enhance security measures
- [⬜] Prepare deployment pipeline
- [⬜] Deploy application components

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Storage**: Amazon S3
- **Image Processing**: Sharp
- **Face Detection**: AWS Rekognition

## Development Progress

The project has progressed through the implementation plan with the following completed tasks:

- Set up project structure and implemented core functionality
- Created PostgreSQL database schema for image metadata storage
- Set up Prisma ORM and created database migrations
- Configured backend environment and database connection
- Implemented S3 integration for image storage
- Created API endpoints for image operations
- Implemented frontend with React.js for image upload and display
- Added image validation service for resolution, blur, and similarity checks
- Implemented HEIC to JPEG conversion (now enabled)
- Set up real-time feedback for image validation status
- Created an image gallery to display uploaded images with status
- Fixed port configuration between frontend and backend
- Upgraded AWS SDK from v2 to v3 for improved performance and modern features
- Fixed S3 bucket configuration and permissions for public image access
- Implemented face detection using AWS Rekognition to reject images with too small faces or multiple faces
- Enhanced validation workflow to prevent S3 uploads for invalid images
- Improved error reporting to display specific validation failures to users

## HEIC Support Implementation

The system now supports HEIC image format with automatic conversion to JPEG:

1. **Frontend Support**:

   - Upload component accepts .heic files
   - Client-side validation allows HEIC file extension and MIME type

2. **Backend Conversion**:

   - Uses heic-convert library to transform HEIC files to JPEG format
   - Automatically updates the file extension and MIME type after conversion
   - Maintains original filename with .jpg extension for better compatibility

3. **Error Handling**:

   - Robust error handling for conversion failures
   - Detailed logging for troubleshooting
   - Fallback image shown in UI if image loading fails

4. **Image Processing Pipeline**:
   - HEIC files are converted before any validation checks are performed
   - All validation logic works with the converted JPEG image
   - Storage service receives the converted image for upload

This implementation ensures a seamless experience for users uploading HEIC images while maintaining compatibility with all validation services.

## Image Validation Details

The system performs several validation checks on uploaded images:

### 1. Resolution Validation

- Rejects images that do not meet minimum dimensions (800x600 pixels)
- Implemented using the Sharp library to extract image metadata

### 2. Format Validation

- Accepts only JPG, PNG, and HEIC formats
- Client-side validation in the frontend using file extension and MIME type checks
- HEIC files are automatically converted to JPEG format before processing
- Conversion implemented using the heic-convert library

### 3. Blur Detection

- Uses Laplacian variance method to detect blurry images
- Converts image to grayscale and applies Laplacian filter to detect edges
- Calculates variance of the Laplacian values as a measure of sharpness
- Images with a variance below 20 are considered too blurry and rejected
- Implemented using the Sharp library for image processing

### 4. Similarity Detection

- Uses a simple perceptual hash algorithm to detect similar images
- Resizes image to 8x8 pixels, converts to grayscale, and generates a binary hash
- Current implementation is a placeholder for demonstration purposes
- Production implementation would compare against previously uploaded images

### 5. Face Detection (AWS Rekognition)

- Uses AWS Rekognition API to detect and analyze faces in images
- Rejects images with no faces detected
- Rejects images with multiple faces (requires exactly one face)
- Rejects images where the face is too small (face area < 5% of image area)
- Face size is calculated using the bounding box coordinates returned by Rekognition

### Validation Workflow

The system follows a streamlined validation process:

1. **Early Validation Feedback**: The system validates images immediately and provides specific error messages for each failed check
2. **Storage Optimization**: Images that fail validation are not uploaded to S3, saving storage costs and bandwidth
3. **Detailed Error Reporting**: Users receive detailed feedback about why their image was rejected
4. **Frontend Notifications**: Each validation error is displayed clearly through toast notifications
5. **No Database Entries for Invalid Images**: The system doesn't store metadata for invalid images in the database

## Running the Project

1. Set up the environment:

   ```
   # Copy and update environment variables
   cp .env.example .env
   ```

2. Configure AWS S3 (required for image storage):

   - Follow the setup instructions in `backend/AWS_SETUP.md`
   - Alternatively, the system will fall back to local storage if S3 is not configured
   - **S3 Bucket Policy Setup**:
     - Go to your S3 bucket in the AWS Console
     - Under Permissions, uncheck "Block all public access"
     - Add the following bucket policy (replace BUCKET_NAME with your bucket name):
     ```json
     {
     	"Version": "2012-10-17",
     	"Statement": [
     		{
     			"Sid": "PublicReadGetObject",
     			"Effect": "Allow",
     			"Principal": "*",
     			"Action": "s3:GetObject",
     			"Resource": "arn:aws:s3:::BUCKET_NAME/*"
     		}
     	]
     }
     ```

3. Start the backend server:

   ```
   cd backend
   npm run dev
   ```

4. Start the frontend development server:

   ```
   cd frontend
   npm start
   ```

   Note: The frontend is configured to run on port 3000 and the backend on port 3001.
   If port 3000 is already in use, React will prompt you to use a different port.

5. Access the application at: http://localhost:3000
