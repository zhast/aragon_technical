import React, { useState, useEffect } from "react";
import { ImageUploader } from "./components/ImageUploader";
import { ImageGallery } from "./components/ImageGallery";
import { ToastContainer } from "react-toastify";
import { getAllImages, deleteImage } from "./services/api";
import { Image } from "./types";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Import the FileWithStatus type or recreate it here
interface FileWithStatus {
	name: string;
	size: number;
	preview: string;
	status: "pending" | "uploading" | "success" | "error";
	errorMessage?: string;
}

function App() {
	const [refreshGallery, setRefreshGallery] = useState(0);
	const [failedUploads, setFailedUploads] = useState<FileWithStatus[]>([]);
	const [invalidImages, setInvalidImages] = useState<Image[]>([]);
	const [loadingInvalid, setLoadingInvalid] = useState(true);

	const handleImageUploaded = () => {
		// Trigger gallery refresh
		setRefreshGallery((prev) => prev + 1);
		// Also fetch invalid images again when an image is uploaded
		fetchInvalidImages();
	};

	// Fetch invalid images from the database
	const fetchInvalidImages = async () => {
		setLoadingInvalid(true);
		try {
			const allImages = await getAllImages();
			const invalid = allImages.filter((img) => img.status === "invalid");
			setInvalidImages(invalid);
		} catch (err) {
			console.error("Error fetching invalid images:", err);
		} finally {
			setLoadingInvalid(false);
		}
	};

	// Fetch invalid images on mount and when refreshGallery changes
	useEffect(() => {
		fetchInvalidImages();
	}, [refreshGallery]);

	const handleUploadFailed = (
		failedFile: FileWithStatus,
		responseData?: any
	) => {
		// Add failed file to the failed uploads list
		setFailedUploads((prevFailed) => {
			// Check if this file is already in the failed uploads
			const existingIndex = prevFailed.findIndex(
				(f) => f.name === failedFile.name && f.size === failedFile.size
			);

			// Create a copy of the failed file
			const updatedFailedFile = { ...failedFile };

			// If we have image data from the server with a URL, use that instead of the local preview
			if (responseData && responseData.image && responseData.image.url) {
				updatedFailedFile.preview = responseData.image.url;
			}

			if (existingIndex >= 0) {
				// Replace the existing entry
				const newList = [...prevFailed];
				newList[existingIndex] = updatedFailedFile;
				return newList;
			} else {
				// Add as a new entry
				return [...prevFailed, updatedFailedFile];
			}
		});

		// Also refresh the gallery to get updated invalid images
		fetchInvalidImages();
	};

	const handleRemoveFailedUpload = (index: number) => {
		setFailedUploads((prevFailed) => {
			const newList = [...prevFailed];
			// Only revoke object URL if it's a blob URL (created by URL.createObjectURL)
			// S3 URLs should not be revoked
			if (newList[index].preview.startsWith("blob:")) {
				URL.revokeObjectURL(newList[index].preview);
			}
			newList.splice(index, 1);
			return newList;
		});
	};

	// Add a handler for deleting invalid images
	const handleDeleteInvalidImage = async (id: string) => {
		if (window.confirm("Are you sure you want to delete this image?")) {
			try {
				const success = await deleteImage(id);
				if (success) {
					setInvalidImages(invalidImages.filter((image) => image.id !== id));
					toast.success("Image deleted successfully");
				} else {
					toast.error("Failed to delete image");
				}
			} catch (error) {
				console.error("Error deleting image:", error);
				toast.error("Error deleting image");
			}
		}
	};

	// Determine if we should show the rejected photos section
	const hasRejectedPhotos =
		invalidImages.length > 0 || failedUploads.length > 0;

	return (
		<div className="App">
			<header className="App-header">
				<h1>Image Upload & Validation System</h1>
			</header>
			<main className="App-main">
				<div className="app-layout">
					<section className="sidebar-section">
						<ImageUploader
							onImageUploaded={handleImageUploaded}
							onUploadFailed={handleUploadFailed}
						/>
					</section>
					<div className="main-content">
						<section className="gallery-section accepted-images">
							<ImageGallery
								refreshTrigger={refreshGallery}
								statusFilter="valid"
								title="Accepted Photos"
							/>
						</section>

						{hasRejectedPhotos && (
							<section className="gallery-section rejected-images">
								<h2>Photos That Didn't Meet Our Guidelines</h2>

								{/* Render failed uploads from the current session */}
								{failedUploads.length > 0 && (
									<div className="gallery-grid">
										{failedUploads.map((file, index) => (
											<div key={`failed-${index}`} className="gallery-item">
												<div className="image-card">
													<img src={file.preview} alt="Failed upload" />
													<div className="image-info">
														<p className="image-name">{file.name}</p>
														<p className="image-size">
															{Math.round(file.size / 1024)} KB
														</p>
														<p className="image-status status-invalid">
															Status: invalid
														</p>
														{file.errorMessage && (
															<p className="rejection-reason">
																{file.errorMessage}
															</p>
														)}
													</div>
													<button
														className="delete-button"
														onClick={() => handleRemoveFailedUpload(index)}
														aria-label="Remove file"
													>
														Delete
													</button>
												</div>
											</div>
										))}
									</div>
								)}

								{/* Add a divider if both sections have content */}
								{failedUploads.length > 0 && invalidImages.length > 0 && (
									<div className="section-divider"></div>
								)}

								{/* Render invalid images from the database */}
								{invalidImages.length > 0 && (
									<div className="gallery-grid">
										{invalidImages.map((image) => (
											<div key={`invalid-${image.id}`} className="gallery-item">
												<div className="image-card">
													<img
														src={image.url}
														alt={image.originalName}
														onError={(e) => {
															e.currentTarget.src =
																"https://via.placeholder.com/400x300?text=Image+Load+Error";
														}}
													/>
													<div className="image-info">
														<p className="image-name">{image.originalName}</p>
														<p className="image-size">
															{Math.round(image.size / 1024)} KB
														</p>
														<p className="image-type">{image.mimeType}</p>
														<p className="image-status status-invalid">
															Status: invalid
														</p>
														{image.validationErrors && (
															<p className="rejection-reason">
																{image.validationErrors.split(";")[0]}
															</p>
														)}
														{image.storageType && (
															<p
																className={`image-storage storage-${image.storageType}`}
															>
																Storage:{" "}
																{image.storageType === "s3"
																	? "S3 Cloud"
																	: "Local"}
															</p>
														)}
													</div>
													<button
														className="delete-button"
														onClick={() => handleDeleteInvalidImage(image.id)}
														aria-label="Delete image"
													>
														Delete
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</section>
						)}
					</div>
				</div>
			</main>
			<ToastContainer position="bottom-right" />
		</div>
	);
}

export default App;
