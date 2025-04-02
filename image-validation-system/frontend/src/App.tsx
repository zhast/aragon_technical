import React, { useState } from "react";
import { ImageUploader } from "./components/ImageUploader";
import { ImageGallery } from "./components/ImageGallery";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
	const [refreshGallery, setRefreshGallery] = useState(0);

	const handleImageUploaded = () => {
		// Trigger gallery refresh
		setRefreshGallery((prev) => prev + 1);
	};

	return (
		<div className="App">
			<header className="App-header">
				<h1>Image Upload & Validation System</h1>
			</header>
			<main className="App-main">
				<section className="upload-section">
					<h2>Upload New Image</h2>
					<ImageUploader onImageUploaded={handleImageUploaded} />
				</section>
				<section className="gallery-section">
					<ImageGallery refreshTrigger={refreshGallery} />
				</section>
			</main>
			<ToastContainer position="bottom-right" />
		</div>
	);
}

export default App;
