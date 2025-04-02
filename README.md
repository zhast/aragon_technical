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

- [✅] Reject images that are too small (size/resolution)
- [✅] Reject non-JPG, PNG, or HEIC formats
- [✅] Reject images too similar to existing ones
- [✅] Reject blurry images
- [⬜] Reject images with too small faces
- [⬜] Reject images with multiple faces

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

- [✅] Implement size/resolution validation
- [✅] Create file format verification
- [✅] Develop image similarity detection algorithm
- [✅] Implement blur detection (Laplacian variance)
- [⬜] Integrate face detection (AWS Rekognition or similar)
- [✅] Set up validation result storage

### Step 6: Frontend Development

- [✅] Create upload component with drag-and-drop
- [✅] Implement client-side file format validation
- [✅] Build image preview functionality
- [✅] Develop state management for upload process
- [✅] Create UI for displaying accepted/rejected images
- [✅] Implement real-time feedback system

### Step 7: Integration & Testing

- [✅] Connect frontend to backend API
- [⬜] Test all validation scenarios
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

We're following the implementation plan step by step. Current status:

- Set up project structure and implemented core functionality
- Created PostgreSQL database schema for image metadata storage
- Set up Prisma ORM and created database migrations
- Configured backend environment and database connection
- Implemented S3 integration for image storage
- Created API endpoints for image operations
- Implemented frontend with React.js for image upload and display
- Added image validation service for resolution, blur, and similarity checks
- Implemented HEIC to JPEG conversion
- Set up real-time feedback for image validation status
- Created an image gallery to display uploaded images with status
- Fixed port configuration between frontend and backend
- Upgraded AWS SDK from v2 to v3 for improved performance and modern features
- Fixed S3 bucket configuration and permissions for public image access

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
