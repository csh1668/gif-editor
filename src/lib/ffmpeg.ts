import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export type PaletteUsage = "on" | "off";

export interface ConvertGifOptions {
	startSec: number;
	durationSec: number | null;
	width: number | null;
	fps: number;
	paletteUse: PaletteUsage;
}

function createSingletonFFmpeg(): FFmpeg {
	const ffmpeg = new FFmpeg();
	return ffmpeg;
}

const singleton: { ffmpeg: FFmpeg | null; loading: boolean } = {
	ffmpeg: null,
	loading: false,
};

export async function getFFmpeg(): Promise<FFmpeg> {
	if (singleton.ffmpeg) return singleton.ffmpeg;
	if (!singleton.loading) {
		singleton.loading = true;
		const ff = createSingletonFFmpeg();
		const baseURL =
			"https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
		const coreURL = await toBlobURL(
			`${baseURL}/ffmpeg-core.js`,
			"text/javascript",
		);
		const wasmURL = await toBlobURL(
			`${baseURL}/ffmpeg-core.wasm`,
			"application/wasm",
		);
		await ff.load({ coreURL, wasmURL });
		singleton.ffmpeg = ff;
	}
	// In case of concurrent callers while loading
	while (!singleton.ffmpeg) {
		await new Promise((r) => setTimeout(r, 50));
	}
	const instance = singleton.ffmpeg;
	if (!instance) throw new Error("FFmpeg failed to initialize");
	return instance;
}

export async function convertVideoToGif(
	input: File | Uint8Array,
	options: ConvertGifOptions,
): Promise<Blob> {
	const { startSec, durationSec, width, fps, paletteUse } = options;
	const ffmpeg = await getFFmpeg();

	const inputName = "input.mp4";
	const outputName = "out.gif";
	const inputData =
		input instanceof Uint8Array ? input : await fetchFile(input);

	try {
		ffmpeg.deleteFile(inputName);
	} catch {}
	try {
		ffmpeg.deleteFile(outputName);
	} catch {}
	await ffmpeg.writeFile(inputName, inputData);

	const trimArgs: string[] = [];
	if (startSec > 0) trimArgs.push("-ss", String(startSec));
	if (durationSec && durationSec > 0) trimArgs.push("-t", String(durationSec));

	const scaleFilter = width
		? `scale=${width}:-1:flags=lanczos`
		: "scale=iw:-1:flags=lanczos";

	if (paletteUse === "on") {
		await ffmpeg.exec([
			"-i",
			inputName,
			...trimArgs,
			"-vf",
			`${scaleFilter},fps=${fps},palettegen=max_colors=128`,
			"-f",
			"image2",
			"-y",
			"palette.png",
		]);

		await ffmpeg.exec([
			"-i",
			inputName,
			...trimArgs,
			"-i",
			"palette.png",
			"-lavfi",
			`${scaleFilter},fps=${fps} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3`,
			"-y",
			outputName,
		]);

		try {
			ffmpeg.deleteFile("palette.png");
		} catch {}
	} else {
		await ffmpeg.exec([
			"-i",
			inputName,
			...trimArgs,
			"-vf",
			`${scaleFilter},fps=${fps}`,
			"-y",
			outputName,
		]);
	}

	const data = await ffmpeg.readFile(outputName);
	const bytes =
		data instanceof Uint8Array ? data : new TextEncoder().encode(data);
	const blob = new Blob([bytes], { type: "image/gif" });

	try {
		ffmpeg.deleteFile(inputName);
	} catch {}
	try {
		ffmpeg.deleteFile(outputName);
	} catch {}

	return blob;
}
