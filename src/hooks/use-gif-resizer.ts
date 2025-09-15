import { useCallback, useEffect } from "react";
import { useGifResizerStore } from "@/stores/gif-resizer-store";
import { GifResizer, initWasm, resizeGif } from "@/utils/wasm";

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
				const bytes = new Uint8Array(arrayBuffer);
				// GIF 시그니처 검증: GIF87a 또는 GIF89a
				if (
					bytes.length < 6 ||
					!(
						bytes[0] === 0x47 && // G
						bytes[1] === 0x49 && // I
						bytes[2] === 0x46 && // F
						bytes[3] === 0x38 && // 8
						(bytes[4] === 0x37 || bytes[4] === 0x39) && // 7 or 9
						bytes[5] === 0x61 // a
					)
				) {
					throw new Error("유효한 GIF 파일이 아닙니다 (헤더 불일치)");
				}

				await initWasm();
				const resizer = new GifResizer();
				try {
					resizer.load_gif(bytes);
					const origW = resizer.original_width;
					const origH = resizer.original_height;
					if (!origW || !origH) {
						throw new Error("GIF 프레임 정보를 읽지 못했습니다");
					}
					store.setOriginalInfo({ width: origW, height: origH, size: file.size });
					store.setDimensions({
						width: Math.floor(origW * 0.5),
						height: Math.floor(origH * 0.5),
					});
				} finally {
					// Rust 객체 메모리 해제
					try {
						resizer.free();
					} catch {}
				}
			} catch (error) {
				console.error("GIF 정보 로드 실패:", error);
				store.setError(error instanceof Error ? error.message : String(error));
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
				const aspectRatio =
					store.originalInfo.height / store.originalInfo.width;
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
				const aspectRatio =
					store.originalInfo.width / store.originalInfo.height;
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
