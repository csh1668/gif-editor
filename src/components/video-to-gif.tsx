import { useEffect, useId, useRef, useState } from "react";
import VideoToGifForm, {
	type VideoToGifFormValues,
} from "@/components/forms/video-to-gif-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import useVideoPreview from "@/hooks/use-video-preview";
import { convertVideoToGif } from "@/lib/ffmpeg";

export default function VideoToGif() {
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [gifUrl, setGifUrl] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const [params, setParams] = useState<VideoToGifFormValues | null>(null);

	const objectUrlRef = useRef<string | null>(null);
	const videoPreviewUrl = useVideoPreview(videoFile);
	const videoInputId = useId();

	useEffect(() => {
		return () => {
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
		};
	}, []);

	// Reset derived states when video file changes
	useEffect(() => {
		// revoke previous GIF blob URL
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}
		// reference videoFile within the effect to match dependency
		if (videoFile !== undefined) {
			setGifUrl(null);
			setParams(null);
			setErr(null);
			setBusy(false);
		}
	}, [videoFile]);

	async function handleConvert() {
		if (!videoFile || !params) return;
		setBusy(true);
		setErr(null);
		try {
			const blob = await convertVideoToGif(videoFile, {
				// startSec: params.startSec,
				// durationSec: params.durationSec,
				// width: params.width,
				// height: params.height,
				// fps: params.fps,
				...params,
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
			<Card>
				<CardHeader>
					<CardTitle>비디오 파일 선택</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2">
						<Label htmlFor={videoInputId}>파일 (mp4, webm 등)</Label>
						<input
							id={videoInputId}
							type="file"
							accept="video/*"
							className="hidden"
							onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
						/>
						<button
							type="button"
							onClick={() => {
								const el = document.getElementById(
									videoInputId,
								) as HTMLInputElement | null;
								el?.click();
							}}
							onDragOver={(e) => {
								e.preventDefault();
							}}
							onDrop={(e) => {
								e.preventDefault();
								const file = e.dataTransfer.files?.[0] ?? null;
								if (file) setVideoFile(file);
							}}
							className="flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer"
						>
							<div className="text-center">
								<div className="font-medium text-foreground">
									드래그하여 업로드 또는 클릭하여 선택
								</div>
								<div className="text-xs mt-1">지원 형식: mp4, webm 등</div>
								{videoFile && (
									<div className="text-xs mt-2 text-muted-foreground">
										선택됨: {videoFile.name}
									</div>
								)}
							</div>
						</button>
					</div>
				</CardContent>
			</Card>

			{videoPreviewUrl && (
				<div className="mt-2">
					{/** biome-ignore lint/a11y/useMediaCaption: 프리뷰는 임시 미디어라 캡션이 없다 */}
					<video
						src={videoPreviewUrl}
						controls
						className="max-w-full rounded border"
						aria-label="video preview"
					/>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>변환 옵션</CardTitle>
				</CardHeader>
				<CardContent>
					<VideoToGifForm
						file={videoFile}
						onChange={(v, ok) => ok && setParams(v)}
					/>
				</CardContent>
			</Card>

			<div className="flex gap-2">
				<Button
					disabled={!videoFile || !params || busy}
					onClick={handleConvert}
					type="button"
				>
					{busy ? "변환 중..." : "GIF 변환"}
				</Button>
				<Button
					variant="outline"
					disabled={!gifUrl}
					onClick={handleSave}
					type="button"
				>
					저장
				</Button>
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
