import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage } from "../services/api";
import { FileWithPreview } from "../types";
import { toast } from "react-toastify";

interface ImageUploaderProps {
	onImageUploaded: () => void;
	onUploadFailed: (failedFile: FileWithStatus, response: any) => void;
}

type UploadStatus = "pending" | "uploading" | "success" | "error";

interface FileWithStatus extends FileWithPreview {
	status: UploadStatus;
	errorMessage?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
	onImageUploaded,
	onUploadFailed,
}) => {
	const [files, setFiles] = useState<FileWithStatus[]>([]);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		// Add preview and status to each file
		const filesWithStatus = acceptedFiles.map((file) =>
			Object.assign(file, {
				preview: URL.createObjectURL(file),
				status: "pending" as UploadStatus,
			})
		);

		// Set the files first, then handle upload in a separate effect
		setFiles((prevFiles) => [...prevFiles, ...filesWithStatus]);
	}, []);

	// Effect to handle auto-upload of new pending files
	useEffect(() => {
		// Find files that are still in pending status and upload them
		files.forEach((file, index) => {
			if (file.status === "pending") {
				handleUpload(index);
			}
		});
	}, [files.length]); // Only trigger when the number of files changes

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

	const handleUpload = async (fileIndex: number) => {
		// Ensure the file exists at this index
		if (!files[fileIndex]) {
			console.error(`No file found at index ${fileIndex}`);
			return;
		}

		// Update the status of the file being uploaded
		const updatedFiles = [...files];
		updatedFiles[fileIndex].status = "uploading";
		setFiles(updatedFiles);

		try {
			const response = await uploadImage(files[fileIndex]);

			if (response.success) {
				if (
					response.status === "invalid" ||
					(response.validationErrors && response.validationErrors.length > 0)
				) {
					// Image was uploaded but has validation errors
					updatedFiles[fileIndex].status = "error";

					// Set a more descriptive error message by using the first validation error
					updatedFiles[fileIndex].errorMessage =
						response.validationErrors && response.validationErrors.length > 0
							? response.validationErrors[0] // Use the first validation error as the message
							: "Failed validation checks";

					setFiles(updatedFiles);

					// Notify parent component about the failed validation (but successful upload)
					onUploadFailed(updatedFiles[fileIndex], response);

					// Display validation errors as toasts
					if (
						response.validationErrors &&
						response.validationErrors.length > 0
					) {
						response.validationErrors.forEach((error) => {
							toast.error(`Validation failed: ${error}`, {
								autoClose: 8000,
								closeOnClick: false,
							});
						});
					}
				} else {
					// Fully successful upload with no validation errors
					updatedFiles[fileIndex].status = "success";
					setFiles(updatedFiles);
					toast.success(`${files[fileIndex].name} uploaded successfully`);
					onImageUploaded();
				}
			} else {
				// HTTP error or other upload failure
				updatedFiles[fileIndex].status = "error";
				updatedFiles[fileIndex].errorMessage =
					response.error || "Upload failed";
				setFiles(updatedFiles);

				// Notify parent component about the failed upload
				onUploadFailed(updatedFiles[fileIndex], response);

				// Show the main error message
				toast.error(response.error || "Upload failed");

				// If there are validation errors, show them in a more detailed manner
				if (response.validationErrors && response.validationErrors.length > 0) {
					response.validationErrors.forEach((error) => {
						toast.error(`Validation failed: ${error}`, {
							autoClose: 8000,
							closeOnClick: false,
						});
					});
				}
			}
		} catch (error) {
			// Update status to error
			updatedFiles[fileIndex].status = "error";
			updatedFiles[fileIndex].errorMessage = "Error uploading image";
			setFiles(updatedFiles);

			// Notify parent component about the failed upload
			onUploadFailed(updatedFiles[fileIndex], null);

			toast.error("Error uploading image");
			console.error("Upload error:", error);
		}
	};

	const handleRemoveFile = (index: number) => {
		const updatedFiles = [...files];
		// Revoke the object URL to avoid memory leaks
		URL.revokeObjectURL(updatedFiles[index].preview);
		updatedFiles.splice(index, 1);
		setFiles(updatedFiles);
	};

	const getStatusIcon = (status: UploadStatus) => {
		switch (status) {
			case "pending":
				return "⏳";
			case "uploading":
				return "⌛";
			case "success":
				return "✅";
			case "error":
				return "❌";
			default:
				return "⏳";
		}
	};

	const handleClearSuccessful = () => {
		// Keep only files with error status and revoke others
		const filesToKeep = files.filter((file) => {
			if (file.status !== "error") {
				URL.revokeObjectURL(file.preview);
				return false;
			}
			return true;
		});
		setFiles(filesToKeep);
	};

	return (
		<div className="image-uploader">
			<div className="sidebar-uploader">
				<div
					{...getRootProps()}
					className={`dropzone ${isDragActive ? "active" : ""}`}
				>
					<input {...getInputProps()} />
					{isDragActive ? (
						<p>Drop the images here...</p>
					) : (
						<p>Drag and drop images here, or click to select</p>
					)}
				</div>

				{files.length > 0 && (
					<>
						<div className="file-list">
							{files.map((file, index) => (
								<div key={index} className={`file-item status-${file.status}`}>
									<span className="status-icon">
										{getStatusIcon(file.status)}
									</span>
									<span className="file-name">{file.name}</span>
									<span className="file-size">
										({Math.round(file.size / 1024)} KB)
									</span>
									{file.status === "error" && (
										<button
											onClick={() => handleUpload(index)}
											className="retry-button small"
										>
											Retry
										</button>
									)}
									<button
										onClick={() => handleRemoveFile(index)}
										className="remove-button"
										aria-label="Remove file"
									>
										×
									</button>
								</div>
							))}
						</div>
						<div className="upload-actions">
							<button onClick={handleClearSuccessful} className="clear-button">
								Clear Successful
							</button>
							<button onClick={() => setFiles([])} className="clear-button">
								Clear All
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
