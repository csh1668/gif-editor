import { create } from "zustand";
import { shallow } from "zustand/shallow";
import type { VideoToGifFormValues } from "@/components/forms/video-to-gif-form";

interface GifConverterState {
	videoFile: File | null;
	params: VideoToGifFormValues | null;
	gifUrl: string | null;
	isConverting: boolean;
	progress: number;
	error: string | null;
	objectUrl: string | null;
}

interface GifConverterActions {
	setVideoFile: (file: File | null) => void;
	setParams: (params: VideoToGifFormValues | null) => void;
	setIsConverting: (isConverting: boolean) => void;
	setProgress: (progress: number) => void;
	setGifUrl: (url: string | null) => void;
	setError: (error: string | null) => void;
	setObjectUrl: (url: string | null) => void;
	resetState: () => void;
	resetForNewVideo: () => void;
}

type GifConverterStore = GifConverterState & GifConverterActions;

export const useGifConverterStore = create<GifConverterStore>((set, get) => ({
	// State
	videoFile: null,
	params: null,
	gifUrl: null,
	isConverting: false,
	progress: 0,
	error: null,
	objectUrl: null,

	setVideoFile: (file) => set({ videoFile: file }),
	setParams: (params) => {
		const prev = get().params;
		if (shallow(prev ?? {}, params ?? {})) return;
		set({ params, error: null });
	},
	setIsConverting: (isConverting) => set({ isConverting }),
	setProgress: (progress) => set({ progress }),
	setGifUrl: (gifUrl) => set({ gifUrl }),
	setError: (error) => set({ error }),
	setObjectUrl: (objectUrl) => set({ objectUrl }),

	resetState: () =>
		set({
			videoFile: null,
			params: null,
			gifUrl: null,
			isConverting: false,
			progress: 0,
			error: null,
			objectUrl: null,
		}),

	resetForNewVideo: () =>
		set({
			params: null,
			gifUrl: null,
			isConverting: false,
			progress: 0,
			error: null,
			objectUrl: null,
		}),
}));
