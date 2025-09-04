import { useEffect } from "react";
import VideoToGifForm from "@/components/forms/video-to-gif-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConversionProgress from "@/components/ui/conversion-progress";
import ErrorMessage from "@/components/ui/error-message";
import FileUploadZone from "@/components/ui/file-upload-zone";
import { useGifConverter } from "@/hooks/use-gif-converter";
import useVideoPreview from "@/hooks/use-video-preview";

export default function VideoToGif() {
	const converter = useGifConverter();
	const videoPreviewUrl = useVideoPreview(converter.videoFile);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			converter.actions.cleanup();
		};
	}, [converter.actions]);

	const canConvert =
		converter.videoFile && converter.params && !converter.isConverting;
	const canDownload = converter.gifUrl && !converter.isConverting;

	return (
		<div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle>비디오 파일 선택</CardTitle>
				</CardHeader>
				<CardContent>
					<FileUploadZone
						accept="video/*"
						onFileSelect={converter.actions.setVideoFile}
						selectedFile={converter.videoFile}
						title="파일 (mp4, webm 등)"
						supportedFormats="지원 형식: mp4, webm 등"
					/>
				</CardContent>
			</Card>

			{videoPreviewUrl && (
				<div className="mt-2 w-fit">
					{/** biome-ignore lint/a11y/useMediaCaption: 프리뷰는 임시 미디어라 캡션이 없다 */}
					<video
						src={videoPreviewUrl}
						controls
						className="border w-auto h-auto max-w-none"
						aria-label="video preview"
					/>
				</div>
			)}

			{converter.videoFile && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>변환 옵션</CardTitle>
						</CardHeader>
						<CardContent>
							<VideoToGifForm
								file={converter.videoFile}
								onChange={(values, isValid) =>
									isValid && converter.actions.setParams(values)
								}
							/>
						</CardContent>
					</Card>

					<div className="flex gap-2">
						<Button
							disabled={!canConvert}
							onClick={converter.actions.convert}
							type="button"
						>
							{converter.isConverting ? "변환 중..." : "GIF 변환"}
						</Button>
						<Button
							variant="outline"
							disabled={!canDownload}
							onClick={converter.actions.downloadGif}
							type="button"
						>
							저장
						</Button>
					</div>

					<ConversionProgress
						progress={converter.progress}
						isVisible={converter.isConverting}
					/>

					<ErrorMessage error={converter.error} />

					{converter.gifUrl && (
						<Card className="w-fit">
							<CardHeader>
								<CardTitle>변환 결과</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<img
									src={converter.gifUrl}
									alt="변환된 GIF 미리보기"
									className="border w-auto h-auto max-w-none"
								/>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	);
}
