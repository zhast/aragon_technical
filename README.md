# Image Upload & Validation System

This project implements a system for uploading, validating, and categorizing images based on specific criteria.

## Project Requirements

### Frontend

- [⬜] Upload images functionality
- [⬜] Frontend validations (HEIC, PNG, JPEG formats)
- [⬜] Real-time feedback on upload status
- [⬜] State management for the upload process
- [⬜] Image previews for uploaded files

### Backend

- [⬜] REST API using Node.js with Express or GraphQL
- [✅] PostgreSQL database for metadata storage
- [⬜] Amazon S3 or equivalent for image storage
- [⬜] RESTful or GraphQL conventions
- [⬜] Efficient system for image processing
- [⬜] Secure file handling
- [✅] ORM integration (Prisma, Knex.js, etc.)
- [⬜] Optimized database queries
- [⬜] HEIC to PNG/JPEG conversion

### Validation Requirements

- [⬜] Reject images that are too small (size/resolution)
- [⬜] Reject non-JPG, PNG, or HEIC formats
- [⬜] Reject images too similar to existing ones
- [⬜] Reject blurry images
- [⬜] Reject images with too small faces
- [⬜] Reject images with multiple faces

## Implementation Plan

### Step 1: Project Setup & Architecture

- [⬜] Create frontend React application
- [✅] Set up Node.js/Express backend
- [✅] Configure PostgreSQL database
- [⬜] Set up S3 bucket or equivalent storage
- [⬜] Design system architecture and API endpoints

### Step 2: Database Design

- [✅] Design schema for image metadata
- [✅] Select and configure ORM (Prisma recommended)
- [✅] Create migration scripts

### Step 3: Backend Core

- [⬜] Implement user authentication (if needed)
- [⬜] Create REST API endpoints for image operations
- [⬜] Set up S3 integration for image storage
- [⬜] Implement basic file upload functionality

### Step 4: Image Processing Pipeline

- [⬜] Create middleware for file validation
- [⬜] Implement HEIC to PNG/JPEG conversion
- [⬜] Design asynchronous processing workflow
- [⬜] Set up secure file handling

### Step 5: Image Validation Services

- [⬜] Implement size/resolution validation
- [⬜] Create file format verification
- [⬜] Develop image similarity detection algorithm
- [⬜] Implement blur detection (Laplacian variance)
- [⬜] Integrate face detection (AWS Rekognition or similar)
- [⬜] Set up validation result storage

### Step 6: Frontend Development

- [⬜] Create upload component with drag-and-drop
- [⬜] Implement client-side file format validation
- [⬜] Build image preview functionality
- [⬜] Develop state management for upload process
- [⬜] Create UI for displaying accepted/rejected images
- [⬜] Implement real-time feedback system

### Step 7: Integration & Testing

- [⬜] Connect frontend to backend API
- [⬜] Test all validation scenarios
- [⬜] Optimize database queries
- [⬜] Implement error handling and logging

### Step 8: Refinement & Deployment

- [⬜] Optimize for performance and scalability
- [⬜] Enhance security measures
- [⬜] Prepare deployment pipeline
- [⬜] Deploy application components

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Storage**: Amazon S3 or equivalent
- **Image Processing**: Sharp or ImageMagick
- **Face Detection**: AWS Rekognition or similar

## Development Progress

We're following the implementation plan step by step. Current status:

- Set up project structure and began implementation
- Created PostgreSQL database schema for image metadata storage
- Set up Prisma ORM and created database migrations
- Configured backend environment and database connection
- Basic backend server is running
