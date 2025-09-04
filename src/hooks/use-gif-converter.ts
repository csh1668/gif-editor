import { useCallback, useEffect } from "react";
import { convertVideoToGif } from "@/lib/ffmpeg";
import { useGifConverterStore } from "@/stores/gif-converter-store";

export function useGifConverter() {
	const store = useGifConverterStore();

	const setVideoFile = useCallback(
		(file: File | null) => {
			// Cleanup previous object URL
			if (store.objectUrl) {
				URL.revokeObjectURL(store.objectUrl);
			}

			store.setVideoFile(file);
			if (file) {
				store.resetForNewVideo();
			}
		},
		[store],
	);

	const convert = useCallback(async () => {
		if (!store.videoFile || !store.params) return;

		// Cleanup previous object URL
		if (store.objectUrl) {
			URL.revokeObjectURL(store.objectUrl);
			store.setObjectUrl(null);
		}

		store.setIsConverting(true);
		store.setProgress(0);
		store.setError(null);
		store.setGifUrl(null);

		try {
			const blob = await convertVideoToGif(
				store.videoFile,
				store.params,
				(progressValue) => {
					store.setProgress(progressValue);
				},
			);

			const url = URL.createObjectURL(blob);
			store.setObjectUrl(url);
			store.setGifUrl(url);
			store.setIsConverting(false);
			store.setProgress(100);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			store.setError(message);
			store.setIsConverting(false);
			store.setProgress(0);
		}
	}, [store]);

	const downloadGif = useCallback(() => {
		if (!store.gifUrl) return;

		const link = document.createElement("a");
		link.href = store.gifUrl;
		link.download = `converted-${Date.now()}.gif`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [store.gifUrl]);

	const reset = useCallback(() => {
		if (store.objectUrl) {
			URL.revokeObjectURL(store.objectUrl);
		}
		store.resetState();
	}, [store]);

	// Cleanup on unmount
	const cleanup = useCallback(() => {
		if (store.objectUrl) {
			URL.revokeObjectURL(store.objectUrl);
		}
	}, [store.objectUrl]);

	useEffect(() => {
		return () => {
			cleanup();
		};
	}, [cleanup]);

	return {
		// State (read-only)
		videoFile: store.videoFile,
		params: store.params,
		gifUrl: store.gifUrl,
		isConverting: store.isConverting,
		progress: store.progress,
		error: store.error,

		// Business logic actions
		actions: {
			setVideoFile,
			setParams: store.setParams,
			convert,
			downloadGif,
			reset,
			cleanup,
		},
	};
}
