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
): Promise<Blob> {
	await initWasm();

	const arrayBuffer = await gifFile.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	const resizer = new GifResizer();

	try {
		resizer.load_gif(uint8Array);
		console.log(
			`Original size: ${resizer.original_width}x${resizer.original_height}, Frames: ${resizer.frame_count}`,
		);

		const resizedData = resizer.resize(newWidth, newHeight);
		return new Blob([resizedData], { type: "image/gif" });
	} catch (error) {
		console.error("Failed to resize GIF:", error);
		throw error;
	}
}
