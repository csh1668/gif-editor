import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadZone from "@/components/ui/file-upload-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGifResizer } from "@/hooks/use-gif-resizer";

export default function GifResize() {
	const resizer = useGifResizer();

	const widthInputId = useId();
	const heightInputId = useId();

	const handleFileSelected = (file: File | null) =>
		resizer.actions.setFile(file);

	useEffect(() => {
		return () => resizer.actions.cleanup();
	}, [resizer.actions]);

	const handleResize = () => resizer.actions.resize();

	const handleDownload = () => resizer.actions.download();

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	};

	const handleWidthChange = (newWidth: number) =>
		resizer.actions.setWidth(newWidth);

	const handleHeightChange = (newHeight: number) =>
		resizer.actions.setHeight(newHeight);

	const setPresetSize = (percentage: number) =>
		resizer.actions.setPreset(percentage);

	return (
		<div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle>GIF 파일 선택</CardTitle>
				</CardHeader>
				<CardContent>
					<FileUploadZone
						accept="image/gif"
						onFileSelect={handleFileSelected}
						selectedFile={resizer.file}
						title="파일 (GIF)"
						supportedFormats="지원 형식: .gif"
					/>
				</CardContent>
			</Card>

			{resizer.originalUrl && (
				<div className="mt-2 w-fit">
					<img
						src={resizer.originalUrl}
						alt="원본 GIF 미리보기"
						className="border w-auto h-auto max-w-none"
					/>
					<div className="mt-2 text-sm text-muted-foreground">
						<p>용량: {formatFileSize(resizer.originalInfo?.size || 0)}</p>
					</div>
				</div>
			)}

			{resizer.file && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>리사이즈 옵션</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2 mb-4">
								<Button
									variant="outline"
									type="button"
									onClick={() => setPresetSize(25)}
								>
									25%
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={() => setPresetSize(50)}
								>
									50%
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={() => setPresetSize(75)}
								>
									75%
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={() => setPresetSize(100)}
								>
									원본
								</Button>
							</div>

							<div className="mb-4 flex items-center gap-2">
								<input
									type="checkbox"
									checked={resizer.maintainAspectRatio}
									onChange={(e) =>
										resizer.actions.setMaintain(e.target.checked)
									}
									className="rounded"
								/>
								<Label className="text-sm font-medium">비율 유지</Label>
							</div>

							<div className="grid grid-cols-2 gap-4 items-end">
								<div className="flex flex-col gap-2">
									<Label htmlFor={widthInputId}>너비 (px)</Label>
									<Input
										id={widthInputId}
										type="number"
										min={1}
										max={2000}
										value={resizer.dimensions.width}
										onChange={(e) => handleWidthChange(Number(e.target.value))}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor={heightInputId}>높이 (px)</Label>
									<Input
										id={heightInputId}
										type="number"
										min={1}
										max={2000}
										value={resizer.dimensions.height}
										onChange={(e) => handleHeightChange(Number(e.target.value))}
									/>
								</div>
							</div>

							<div className="mt-4 flex gap-2">
								<Button
									disabled={resizer.isProcessing}
									onClick={handleResize}
									type="button"
								>
									{resizer.isProcessing ? "처리 중..." : "리사이즈"}
								</Button>
								<Button
									variant="outline"
									disabled={!resizer.resizedUrl || resizer.isProcessing}
									onClick={handleDownload}
									type="button"
								>
									저장
								</Button>
							</div>
						</CardContent>
					</Card>

					{resizer.resizedUrl && (
						<div className="mt-2 w-fit">
							<img
								src={resizer.resizedUrl}
								alt="리사이즈된 GIF"
								className="border w-auto h-auto max-w-none"
							/>
							<div className="mt-2 text sm text-muted-foreground">
								<p>
									크기: {resizer.dimensions.width}x{resizer.dimensions.height}px
								</p>
								<p>
									파일 크기: {formatFileSize(resizer.resizedInfo?.size || 0)}
								</p>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
