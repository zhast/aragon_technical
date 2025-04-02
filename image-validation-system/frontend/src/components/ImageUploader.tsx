import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage } from "../services/api";
import { FileWithPreview } from "../types";
import { toast } from "react-toastify";

interface ImageUploaderProps {
	onImageUploaded: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
	onImageUploaded,
}) => {
	const [files, setFiles] = useState<FileWithPreview[]>([]);
	const [uploading, setUploading] = useState(false);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		// Add preview to each file
		const filesWithPreview = acceptedFiles.map((file) =>
			Object.assign(file, {
				preview: URL.createObjectURL(file),
			})
		);
		setFiles(filesWithPreview);
	}, []);

	// Validate file types (JPG, PNG, HEIC)
	const validateFileType = (file: File) => {
		const validTypes = ["image/jpeg", "image/png", "image/heic"];
		if (
			!validTypes.includes(file.type) &&
			!(file.name.endsWith(".heic") || file.name.endsWith(".HEIC"))
		) {
			return {
				code: "file-invalid-type",
				message: "File type must be JPG, PNG, or HEIC",
			};
		}
		return null;
	};

	const { getRootProps, getInputProps, isDragActive, fileRejections } =
		useDropzone({
			onDrop,
			maxFiles: 1,
			accept: {
				"image/jpeg": [".jpg", ".jpeg"],
				"image/png": [".png"],
				"image/heic": [".heic"],
			},
			validator: validateFileType,
		});

	// Handle rejected files
	useEffect(() => {
		fileRejections.forEach(({ file, errors }) => {
			errors.forEach((error) => {
				toast.error(`${file.name}: ${error.message}`);
			});
		});
	}, [fileRejections]);

	// Clean up previews when component unmounts
	useEffect(() => {
		return () => {
			files.forEach((file) => URL.revokeObjectURL(file.preview));
		};
	}, [files]);

	const handleUpload = async () => {
		if (files.length === 0) {
			toast.warn("Please select a file to upload");
			return;
		}

		setUploading(true);
		try {
			const response = await uploadImage(files[0]);

			if (response.success) {
				toast.success("Image uploaded successfully");
				setFiles([]);
				onImageUploaded();
			} else {
				// Show the main error message
				toast.error(response.error || "Upload failed");

				// If there are validation errors, show them in a more detailed manner
				if (response.validationErrors && response.validationErrors.length > 0) {
					response.validationErrors.forEach((error) => {
						toast.error(`Validation failed: ${error}`, {
							autoClose: 8000, // Stay open longer for validation errors
							closeOnClick: false,
						});
					});
				}

				// If there's a detailed message, log it to console
				if (response.details) {
					console.error("Detailed error:", response.details);
				}
			}
		} catch (error) {
			toast.error("Error uploading image");
			console.error("Upload error:", error);
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="image-uploader">
			<div
				{...getRootProps()}
				className={`dropzone ${isDragActive ? "active" : ""}`}
			>
				<input {...getInputProps()} />
				{isDragActive ? (
					<p>Drop the image here...</p>
				) : (
					<p>Drag and drop an image here, or click to select</p>
				)}
			</div>

			{files.length > 0 && (
				<div className="preview-container">
					<div className="image-preview">
						<img src={files[0].preview} alt="Preview" />
						<p>
							{files[0].name} ({Math.round(files[0].size / 1024)} KB)
						</p>
					</div>
					<button
						onClick={handleUpload}
						disabled={uploading}
						className="upload-button"
					>
						{uploading ? "Uploading..." : "Upload Image"}
					</button>
				</div>
			)}
		</div>
	);
};
