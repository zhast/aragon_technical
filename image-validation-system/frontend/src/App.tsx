import React, { useState } from "react";
import { ImageUploader } from "./components/ImageUploader";
import { ImageGallery } from "./components/ImageGallery";
import { ToastContainer } from "react-toastify";
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

	const handleImageUploaded = () => {
		// Trigger gallery refresh
		setRefreshGallery((prev) => prev + 1);
	};

	const handleUploadFailed = (failedFile: FileWithStatus) => {
		// Add failed file to the failed uploads list
		setFailedUploads((prevFailed) => {
			// Check if this file is already in the failed uploads
			const existingIndex = prevFailed.findIndex(
				(f) => f.name === failedFile.name && f.size === failedFile.size
			);

			if (existingIndex >= 0) {
				// Replace the existing entry
				const newList = [...prevFailed];
				newList[existingIndex] = failedFile;
				return newList;
			} else {
				// Add as a new entry
				return [...prevFailed, failedFile];
			}
		});
	};

	const handleRemoveFailedUpload = (index: number) => {
		setFailedUploads((prevFailed) => {
			const newList = [...prevFailed];
			// Release the object URL to prevent memory leaks
			URL.revokeObjectURL(newList[index].preview);
			newList.splice(index, 1);
			return newList;
		});
	};

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
						<section className="gallery-section">
							<h2>Uploaded Images</h2>
							<ImageGallery refreshTrigger={refreshGallery} />
						</section>

						{failedUploads.length > 0 && (
							<section className="failed-uploads-section">
								<h2>Some Photos Didn't Meet Our Guidelines</h2>
								<div className="failed-photos-grid">
									{failedUploads.map((file, index) => (
										<div key={index} className="failed-photo-item">
											<div className="failed-photo-card">
												<img src={file.preview} alt={file.name} />
												<div className="failed-photo-info">
													<p className="failed-photo-name">{file.name}</p>
													<p className="failed-photo-size">
														({Math.round(file.size / 1024)} KB)
													</p>
													<p className="failed-photo-error">
														{file.errorMessage}
													</p>
												</div>
												<button
													className="remove-failed-button"
													onClick={() => handleRemoveFailedUpload(index)}
												>
													Remove
												</button>
											</div>
										</div>
									))}
								</div>
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
