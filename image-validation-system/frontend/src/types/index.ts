export interface Image {
	id: string;
	filename: string;
	originalName: string;
	mimeType: string;
	size: number;
	url: string;
	status: "valid" | "invalid" | "processing";
	s3Key: string;
	storageType?: "s3" | "local";
	validationErrors?: string;
	createdAt: string;
	updatedAt: string;
}

export interface FileWithPreview extends File {
	preview: string;
}

export interface UploadResponse {
	success: boolean;
	image?: Image;
	error?: string;
	validationErrors?: string[];
	details?: string;
	status?: "valid" | "invalid" | "processing";
}
