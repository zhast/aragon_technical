import axios from "axios";
import { Image, UploadResponse } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Create an axios instance
const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export const uploadImage = async (file: File): Promise<UploadResponse> => {
	try {
		const formData = new FormData();
		formData.append("image", file);

		console.log("Uploading to:", API_URL);

		const response = await api.post("/images/upload", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		// Handle both valid and invalid images that were successfully uploaded
		const data = response.data;
		return {
			success: true,
			image: data,
			validationErrors: data.validationErrors || [],
			status: data.status,
		};
	} catch (error) {
		console.error("Full upload error:", error);
		if (axios.isAxiosError(error) && error.response) {
			console.error("Response data:", error.response.data);
			console.error("Response status:", error.response.status);

			// Return detailed validation errors if available
			const responseData = error.response.data;
			return {
				success: false,
				error: responseData.error || "Upload failed",
				validationErrors: responseData.validationErrors || [],
				details: responseData.details || undefined,
				status: responseData.status,
			};
		}
		return { success: false, error: "Upload failed" };
	}
};

export const getAllImages = async (): Promise<Image[]> => {
	const response = await api.get("/images");
	return response.data;
};

export const getImageById = async (id: string): Promise<Image> => {
	const response = await api.get(`/images/${id}`);
	return response.data;
};

export const deleteImage = async (id: string): Promise<boolean> => {
	try {
		await api.delete(`/images/${id}`);
		return true;
	} catch (error) {
		console.error("Error deleting image:", error);
		return false;
	}
};
