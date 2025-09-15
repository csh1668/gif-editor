import init, { GifResizer } from "@pkg/gif_editor";

let wasmInitialized = false;

export async function initWasm() {
	if (!wasmInitialized) {
		await init();
		wasmInitialized = true;
	}
}

export { GifResizer };

export async function resizeGif(
	gifFile: File,
	newWidth: number,
	newHeight: number,
	options?: { quality?: number; fast?: boolean },
): Promise<Blob> {
	await initWasm();

	const arrayBuffer = await gifFile.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	const resizer = new GifResizer();

	try {
		resizer.load_gif(uint8Array);
		const quality = Math.max(1, Math.min(100, options?.quality ?? 90));
		const fast = options?.fast ?? false;
		// d.ts가 재생성되기 전까지 임시 any 캐스팅 사용
		const resizedData = resizer.resize_gifski(
			newWidth,
			newHeight,
			quality,
			fast,
		);
		return new Blob([resizedData], { type: "image/gif" });
	} catch (error) {
		console.error("Failed to resize GIF with gifski:", error);
		throw error;
	}
}
