import { useEffect, useId, useMemo, useRef, useState } from "react";
import { convertVideoToGif } from "@/lib/ffmpeg";

export default function VideoToGif() {
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [gifUrl, setGifUrl] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const [startSec, setStartSec] = useState(0);
	const [durationSec, setDurationSec] = useState<number | null>(3);
	const [width, setWidth] = useState<number | null>(360);
	const [fps, setFps] = useState(10);
	const [paletteUse, setPaletteUse] = useState<"on" | "off">("on");

	const objectUrlRef = useRef<string | null>(null);
	const videoInputId = useId();

	useEffect(() => {
		return () => {
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
		};
	}, []);

	const estimatedSizeText = useMemo(() => {
		if (!videoFile) return "";
		const targetW = width ?? 360;
		const sec = durationSec ?? 3;
		const est = targetW * sec * fps * (paletteUse === "on" ? 24 : 30);
		const sizeMB = est / (1024 * 1024);
		return `${sizeMB.toFixed(2)} MB 예상 (대략치)`;
	}, [videoFile, width, durationSec, fps, paletteUse]);

	async function handleConvert() {
		if (!videoFile) return;
		setBusy(true);
		setErr(null);
		try {
			const blob = await convertVideoToGif(videoFile, {
				startSec,
				durationSec,
				width,
				fps,
				paletteUse,
			});
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
			const url = URL.createObjectURL(blob);
			objectUrlRef.current = url;
			setGifUrl(url);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setErr(message);
		} finally {
			setBusy(false);
		}
	}

	function handleSave() {
		if (!gifUrl) return;
		const a = document.createElement("a");
		a.href = gifUrl;
		a.download = "converted.gif";
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	return (
		<div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
			<div className="flex flex-col gap-2">
				<label className="text-sm" htmlFor={videoInputId}>
					비디오 파일 선택 (mp4, webm 등)
				</label>
				<input
					type="file"
					accept="video/*"
					id={videoInputId}
					onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<label className="flex flex-col gap-1">
					<span className="text-sm">시작 (초)</span>
					<input
						type="number"
						min={0}
						value={startSec}
						onChange={(e) => setStartSec(Math.max(0, Number(e.target.value)))}
						className="border rounded px-2 py-1"
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span className="text-sm">길이 (초, 빈칸=전체)</span>
					<input
						type="number"
						min={0}
						value={durationSec ?? ""}
						onChange={(e) => {
							const v = e.target.value;
							setDurationSec(v === "" ? null : Math.max(0, Number(v)));
						}}
						className="border rounded px-2 py-1"
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span className="text-sm">너비 (px, 빈칸=원본)</span>
					<input
						type="number"
						min={1}
						value={width ?? ""}
						onChange={(e) => {
							const v = e.target.value;
							setWidth(v === "" ? null : Math.max(1, Number(v)));
						}}
						className="border rounded px-2 py-1"
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span className="text-sm">FPS</span>
					<input
						type="number"
						min={1}
						max={30}
						value={fps}
						onChange={(e) =>
							setFps(Math.max(1, Math.min(30, Number(e.target.value))))
						}
						className="border rounded px-2 py-1"
					/>
				</label>
				<label className="flex items-center gap-2 col-span-2">
					<input
						type="checkbox"
						checked={paletteUse === "on"}
						onChange={(e) => setPaletteUse(e.target.checked ? "on" : "off")}
					/>
					<span className="text-sm">팔레트 사용(품질 개선, 용량 절감)</span>
				</label>
			</div>

			<div className="text-xs text-muted-foreground">{estimatedSizeText}</div>

			<div className="flex gap-2">
				<button
					disabled={!videoFile || busy}
					onClick={handleConvert}
					className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
					type="button"
				>
					{busy ? "변환 중..." : "GIF 변환"}
				</button>
				<button
					disabled={!gifUrl}
					onClick={handleSave}
					className="px-3 py-2 rounded border"
					type="button"
				>
					저장
				</button>
			</div>

			{err && <div className="text-red-600 text-sm">{err}</div>}

			{gifUrl && (
				<div className="mt-4">
					<img
						src={gifUrl}
						alt="gif preview"
						className="max-w-full rounded border"
					/>
				</div>
			)}
		</div>
	);
}
