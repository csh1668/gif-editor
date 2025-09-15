import { create } from "zustand";

interface Dimensions {
	width: number;
	height: number;
}

interface OriginalInfo {
	width: number;
	height: number;
	size: number;
}

interface ResizedInfo {
	size: number;
}

interface GifResizerState {
	file: File | null;
	originalInfo: OriginalInfo | null;
	resizedInfo: ResizedInfo | null;
	dimensions: Dimensions;
	maintainAspectRatio: boolean;
	isProcessing: boolean;
	originalUrl: string | null;
	resizedUrl: string | null;
	error: string | null;
}

interface GifResizerActions {
	setFile: (file: File | null) => void;
	setDimensions: (dimensions: Dimensions) => void;
	setMaintainAspectRatio: (maintain: boolean) => void;
	setIsProcessing: (processing: boolean) => void;
	setOriginalInfo: (info: OriginalInfo | null) => void;
	setResizedInfo: (info: ResizedInfo | null) => void;
	setOriginalUrl: (url: string | null) => void;
	setResizedUrl: (url: string | null) => void;
	setError: (error: string | null) => void;
	resetState: () => void;
	resetForNewFile: () => void;
}

export type GifResizerStore = GifResizerState & GifResizerActions;

export const useGifResizerStore = create<GifResizerStore>((set) => ({
	file: null,
	originalInfo: null,
	resizedInfo: null,
	dimensions: { width: 300, height: 300 },
	maintainAspectRatio: true,
	isProcessing: false,
	originalUrl: null,
	resizedUrl: null,
	error: null,

	setFile: (file) => set({ file }),
	setDimensions: (dimensions) => set({ dimensions }),
	setMaintainAspectRatio: (maintainAspectRatio) => set({ maintainAspectRatio }),
	setIsProcessing: (isProcessing) => set({ isProcessing }),
	setOriginalInfo: (originalInfo) => set({ originalInfo }),
	setResizedInfo: (resizedInfo) => set({ resizedInfo }),
	setOriginalUrl: (originalUrl) => set({ originalUrl }),
	setResizedUrl: (resizedUrl) => set({ resizedUrl }),
	setError: (error) => set({ error }),

	resetState: () =>
		set({
			file: null,
			originalInfo: null,
			resizedInfo: null,
			dimensions: { width: 300, height: 300 },
			maintainAspectRatio: true,
			isProcessing: false,
			originalUrl: null,
			resizedUrl: null,
			error: null,
		}),

	resetForNewFile: () =>
		set({
			originalInfo: null,
			resizedInfo: null,
			maintainAspectRatio: true,
			isProcessing: false,
			originalUrl: null,
			resizedUrl: null,
			error: null,
		}),
}));
