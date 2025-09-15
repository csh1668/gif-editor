import { useCallback, useEffect } from "react";
import { GifResizer, initWasm, resizeGif } from "@/utils/wasm";
import { useGifResizerStore } from "@/stores/gif-resizer-store";

export function useGifResizer() {
	const store = useGifResizerStore();

	const setFile = useCallback(
		async (file: File | null) => {
			// cleanup previous URLs
			if (store.originalUrl) URL.revokeObjectURL(store.originalUrl);
			if (store.resizedUrl) URL.revokeObjectURL(store.resizedUrl);

			store.setFile(file);
			store.resetForNewFile();

			if (!file) return;
			if (file.type !== "image/gif") return;

			try {
				store.setOriginalInfo({ width: 0, height: 0, size: file.size });
				const url = URL.createObjectURL(file);
				store.setOriginalUrl(url);

				const arrayBuffer = await file.arrayBuffer();
				await initWasm();
				const uint8Array = new Uint8Array(arrayBuffer);
				const resizer = new GifResizer();
				resizer.load_gif(uint8Array);
				store.setOriginalInfo({
					width: resizer.original_width,
					height: resizer.original_height,
					size: file.size,
				});
				store.setDimensions({
					width: Math.floor(resizer.original_width * 0.5),
					height: Math.floor(resizer.original_height * 0.5),
				});
			} catch (error) {
				console.error("GIF 정보 로드 실패:", error);
				store.setError(
					error instanceof Error ? error.message : String(error),
				);
			}
		},
		[store],
	);

	const resize = useCallback(async () => {
		if (!store.file) return;
		store.setIsProcessing(true);
		try {
			const blob = await resizeGif(
				store.file,
				store.dimensions.width,
				store.dimensions.height,
			);
			const url = URL.createObjectURL(blob);
			store.setResizedUrl(url);
			store.setResizedInfo({ size: blob.size });
		} catch (error) {
			console.error("리사이즈 실패:", error);
			store.setError(error instanceof Error ? error.message : String(error));
		} finally {
			store.setIsProcessing(false);
		}
	}, [store]);

	const download = useCallback(() => {
		if (!store.resizedUrl) return;
		const link = document.createElement("a");
		link.href = store.resizedUrl;
		link.download = `resized_${store.file?.name || "gif"}.gif`;
		link.click();
	}, [store.resizedUrl, store.file]);

	const setWidth = useCallback(
		(newWidth: number) => {
			if (store.maintainAspectRatio && store.originalInfo) {
				const aspectRatio = store.originalInfo.height / store.originalInfo.width;
				store.setDimensions({
					width: newWidth,
					height: Math.round(newWidth * aspectRatio),
				});
			} else {
				store.setDimensions({ ...store.dimensions, width: newWidth });
			}
		},
		[store],
	);

	const setHeight = useCallback(
		(newHeight: number) => {
			if (store.maintainAspectRatio && store.originalInfo) {
				const aspectRatio = store.originalInfo.width / store.originalInfo.height;
				store.setDimensions({
					width: Math.round(newHeight * aspectRatio),
					height: newHeight,
				});
			} else {
				store.setDimensions({ ...store.dimensions, height: newHeight });
			}
		},
		[store],
	);

	const setPreset = useCallback(
		(percentage: number) => {
			if (!store.originalInfo) return;
			store.setDimensions({
				width: Math.round((store.originalInfo.width * percentage) / 100),
				height: Math.round((store.originalInfo.height * percentage) / 100),
			});
		},
		[store.originalInfo, store.setDimensions],
	);

	const setMaintain = useCallback(
		(maintain: boolean) => store.setMaintainAspectRatio(maintain),
		[store],
	);

	const cleanup = useCallback(() => {
		if (store.originalUrl) {
      URL.revokeObjectURL(store.originalUrl);
      
    }
		if (store.resizedUrl) URL.revokeObjectURL(store.resizedUrl);
	}, [store.originalUrl, store.resizedUrl]);

	useEffect(() => {
		return () => cleanup();
	}, [cleanup]);

	return {
		// readonly state
		file: store.file,
		originalInfo: store.originalInfo,
		resizedInfo: store.resizedInfo,
		dimensions: store.dimensions,
		maintainAspectRatio: store.maintainAspectRatio,
		isProcessing: store.isProcessing,
		originalUrl: store.originalUrl,
		resizedUrl: store.resizedUrl,
		error: store.error,

		// actions
		actions: {
			setFile,
			resize,
			download,
			setWidth,
			setHeight,
			setPreset,
			setMaintain,
			cleanup,
		},
	};
}


