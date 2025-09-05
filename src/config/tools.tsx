import GifCrop from "@/components/features/gif-crop";
import GifResize from "@/components/features/gif-resize";
import VideoToGif from "@/components/features/video-to-gif";
import type { ToolDefinition } from "@/types/tools";

export const tools: ToolDefinition[] = [
	{
		id: "video-to-gif",
		label: "Video → GIF",
		description: "비디오 파일을 GIF로 변환",
		component: VideoToGif,
	},
	{
		id: "gif-crop",
		label: "GIF Crop",
		description: "GIF 이미지를 원하는 영역으로 자르기",
		component: GifCrop,
	},
	{
		id: "gif-resize",
		label: "GIF Resize",
		description: "GIF 이미지를 원하는 크기로 리사이즈",
		component: GifResize,
	},
];

export const defaultToolId = tools[0].id;

export function findToolById(
	id: string | null | undefined,
): ToolDefinition | null {
	if (!id) return null;
	return tools.find((t) => t.id === id) ?? null;
}
