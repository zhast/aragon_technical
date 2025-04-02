import React, { useEffect, useState } from "react";
import { Image } from "../types";
import { getAllImages, deleteImage } from "../services/api";
import { toast } from "react-toastify";

interface ImageGalleryProps {
	refreshTrigger: number;
	statusFilter?: "valid" | "invalid" | "all";
	title?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
	refreshTrigger,
	statusFilter = "all",
	title = "Images",
}) => {
	const [images, setImages] = useState<Image[]>([]);
	const [filteredImages, setFilteredImages] = useState<Image[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchImages = async () => {
		setLoading(true);
		try {
			const fetchedImages = await getAllImages();
			setImages(fetchedImages);
			setError(null);
		} catch (err) {
			console.error("Error fetching images:", err);
			setError("Failed to load images");
			toast.error("Failed to load images");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchImages();
	}, [refreshTrigger]);

	// Filter images when images array or statusFilter changes
	useEffect(() => {
		if (statusFilter === "all") {
			setFilteredImages(images);
		} else {
			setFilteredImages(
				images.filter((image) => image.status === statusFilter)
			);
		}
	}, [images, statusFilter]);

	const handleDelete = async (id: string) => {
		if (window.confirm("Are you sure you want to delete this image?")) {
			try {
				const success = await deleteImage(id);
				if (success) {
					setImages(images.filter((image) => image.id !== id));
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

	if (loading && images.length === 0) {
		return <div className="loading">Loading images...</div>;
	}

	if (error && images.length === 0) {
		return <div className="error">{error}</div>;
	}

	if (filteredImages.length === 0) {
		return (
			<div className="no-images">
				No {statusFilter !== "all" ? statusFilter : ""} images available
			</div>
		);
	}

	return (
		<div className="image-gallery">
			<h2>{title}</h2>
			<div className="gallery-grid">
				{filteredImages.map((image) => (
					<div key={image.id} className="gallery-item">
						<div className="image-card">
							<img
								src={image.url}
								alt={image.originalName}
								onError={(e) => {
									console.error(`Failed to load image: ${image.url}`);
									e.currentTarget.src =
										"https://via.placeholder.com/400x300?text=Image+Load+Error";
								}}
							/>
							<div className="image-info">
								<p className="image-name">{image.originalName}</p>
								<p className="image-size">{Math.round(image.size / 1024)} KB</p>
								<p className="image-type">{image.mimeType}</p>
								<p className={`image-status status-${image.status}`}>
									Status: {image.status}
								</p>
								{image.storageType && (
									<p className={`image-storage storage-${image.storageType}`}>
										Storage: {image.storageType === "s3" ? "S3 Cloud" : "Local"}
									</p>
								)}
							</div>
							<button
								className="delete-button"
								onClick={() => handleDelete(image.id)}
								aria-label="Delete image"
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
