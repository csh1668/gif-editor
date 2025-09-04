export interface ConversionState {
	status: "idle" | "converting" | "completed" | "error";
	progress: number;
	error?: string;
}

export interface ConversionResult {
	blob: Blob;
	url: string;
	filename: string;
}

export type ProgressCallback = (progress: number) => void;
