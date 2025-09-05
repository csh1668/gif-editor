import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadZone from "@/components/ui/file-upload-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resizeGif } from "@/utils/wasm";

export default function GifResize() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [originalPreview, setOriginalPreview] = useState<string | null>(null);
	const [resizedPreview, setResizedPreview] = useState<string | null>(null);
	const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
	const [isProcessing, setIsProcessing] = useState(false);
	const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
	const [originalInfo, setOriginalInfo] = useState<{
		width: number;
		height: number;
		size: number;
	} | null>(null);
	const [resizedInfo, setResizedInfo] = useState<{ size: number } | null>(null);

	const widthInputId = useId();
	const heightInputId = useId();

	const handleFileSelected = useCallback(async (file: File | null) => {
		if (!file) return;
		if (file.type !== "image/gif") return;

		setSelectedFile(file);
		setOriginalInfo({ width: 0, height: 0, size: file.size });

		const url = URL.createObjectURL(file);
		setOriginalPreview(url);
		setResizedPreview(null);
		setResizedInfo(null);

		try {
			const { GifResizer, initWasm } = await import("@/utils/wasm");
			await initWasm();
			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const resizer = new GifResizer();
			resizer.load_gif(uint8Array);
			setOriginalInfo({
				width: resizer.original_width,
				height: resizer.original_height,
				size: file.size,
			});
			setDimensions({
				width: Math.floor(resizer.original_width * 0.5),
				height: Math.floor(resizer.original_height * 0.5),
			});
		} catch (error) {
			console.error("GIF 정보 로드 실패:", error);
		}
	}, []);

	useEffect(() => {
		return () => {
			if (originalPreview) URL.revokeObjectURL(originalPreview);
			if (resizedPreview) URL.revokeObjectURL(resizedPreview);
		};
	}, [originalPreview, resizedPreview]);

	const handleResize = useCallback(async () => {
		if (!selectedFile) return;

		setIsProcessing(true);
		try {
			const resizedBlob = await resizeGif(
				selectedFile,
				dimensions.width,
				dimensions.height,
			);
			const url = URL.createObjectURL(resizedBlob);
			setResizedPreview(url);
			setResizedInfo({ size: resizedBlob.size });
		} catch (error) {
			console.error("리사이즈 실패:", error);
			alert("GIF 리사이즈에 실패했습니다.");
		} finally {
			setIsProcessing(false);
		}
	}, [selectedFile, dimensions]);

	const handleDownload = useCallback(() => {
		if (!resizedPreview) return;

		const link = document.createElement("a");
		link.href = resizedPreview;
		link.download = `resized_${selectedFile?.name || "gif"}.gif`;
		link.click();
	}, [resizedPreview, selectedFile]);

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	};

	const handleWidthChange = useCallback(
		(newWidth: number) => {
			if (maintainAspectRatio && originalInfo) {
				const aspectRatio = originalInfo.height / originalInfo.width;
				setDimensions({
					width: newWidth,
					height: Math.round(newWidth * aspectRatio),
				});
			} else {
				setDimensions((prev) => ({ ...prev, width: newWidth }));
			}
		},
		[maintainAspectRatio, originalInfo],
	);

	const handleHeightChange = useCallback(
		(newHeight: number) => {
			if (maintainAspectRatio && originalInfo) {
				const aspectRatio = originalInfo.width / originalInfo.height;
				setDimensions({
					width: Math.round(newHeight * aspectRatio),
					height: newHeight,
				});
			} else {
				setDimensions((prev) => ({ ...prev, height: newHeight }));
			}
		},
		[maintainAspectRatio, originalInfo],
	);

	const setPresetSize = useCallback(
		(percentage: number) => {
			if (originalInfo) {
				setDimensions({
					width: Math.round((originalInfo.width * percentage) / 100),
					height: Math.round((originalInfo.height * percentage) / 100),
				});
			}
		},
		[originalInfo],
	);

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
						selectedFile={selectedFile}
						title="파일 (GIF)"
						supportedFormats="지원 형식: .gif"
					/>
				</CardContent>
			</Card>

			{originalPreview && (
				<div className="mt-2 w-fit">
					<img
						src={originalPreview}
						alt="원본 GIF 미리보기"
						className="border w-auto h-auto max-w-none"
					/>
					<div className="mt-2 text-sm text-muted-foreground">
						<p>용량: {formatFileSize(originalInfo?.size || 0)}</p>
					</div>
				</div>
			)}

			{selectedFile && (
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
									checked={maintainAspectRatio}
									onChange={(e) => setMaintainAspectRatio(e.target.checked)}
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
										value={dimensions.width}
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
										value={dimensions.height}
										onChange={(e) => handleHeightChange(Number(e.target.value))}
									/>
								</div>
							</div>

							<div className="mt-4 flex gap-2">
								<Button
									disabled={isProcessing}
									onClick={handleResize}
									type="button"
								>
									{isProcessing ? "처리 중..." : "리사이즈"}
								</Button>
								<Button
									variant="outline"
									disabled={!resizedPreview || isProcessing}
									onClick={handleDownload}
									type="button"
								>
									저장
								</Button>
							</div>
						</CardContent>
					</Card>

					{resizedPreview && (
						<div className="mt-2 w-fit">
							<img
								src={resizedPreview}
								alt="리사이즈된 GIF"
								className="border w-auto h-auto max-w-none"
							/>
							<div className="mt-2 text-sm text-muted-foreground">
								<p>
									크기: {dimensions.width}x{dimensions.height}px
								</p>
								<p>파일 크기: {formatFileSize(resizedInfo?.size || 0)}</p>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
