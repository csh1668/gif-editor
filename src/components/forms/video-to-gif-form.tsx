import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// empty string -> null, string/number -> number, else null
const nullableNumberWithBounds = (min?: number, max?: number) => {
	let base = z.number();
	if (min !== undefined) base = base.min(min);
	if (max !== undefined) base = base.max(max);
	return z.preprocess(
		(v) => {
			if (v === "" || v == null) return null;
			const n = typeof v === "string" ? Number(v) : v;
			if (typeof n !== "number" || Number.isNaN(n)) return null;
			return n;
		},
		z.union([base, z.null()]),
	);
};

const schema = z.object({
	startSec: z.coerce.number().min(0),
	durationSec: nullableNumberWithBounds(0),
	width: nullableNumberWithBounds(1),
	height: nullableNumberWithBounds(1),
	fps: z.coerce.number().min(1).max(30),
});

export type VideoToGifFormValues = z.infer<typeof schema>;

type Props = {
	file: File | null;
	onChange?: (values: VideoToGifFormValues, isValid: boolean) => void;
};

type VideoMeta = {
	duration: number;
	width: number;
	height: number;
} | null;

function useVideoMeta(file: File | null): VideoMeta {
	const [meta, setMeta] = useState<VideoMeta>(null);
	const urlRef = useRef<string | null>(null);

	useEffect(() => {
		setMeta(null);
		if (!file) return;
		if (urlRef.current) URL.revokeObjectURL(urlRef.current);
		const url = URL.createObjectURL(file);
		urlRef.current = url;

		const video = document.createElement("video");
		video.preload = "metadata";
		video.src = url;
		const onLoaded = () => {
			const duration = Number.isFinite(video.duration) ? video.duration : 0;
			setMeta({
				duration,
				width: video.videoWidth || 0,
				height: video.videoHeight || 0,
			});
		};
		const onError = () => setMeta({ duration: 0, width: 0, height: 0 });
		video.addEventListener("loadedmetadata", onLoaded);
		video.addEventListener("error", onError);
		return () => {
			video.removeEventListener("loadedmetadata", onLoaded);
			video.removeEventListener("error", onError);
			if (urlRef.current) URL.revokeObjectURL(urlRef.current);
			urlRef.current = null;
		};
	}, [file]);

	return meta;
}

export default function VideoToGifForm({ file, onChange }: Props) {
	const meta = useVideoMeta(file);

	const resolver: Resolver<VideoToGifFormValues> = zodResolver(
		schema,
	) as unknown as Resolver<VideoToGifFormValues>;

	const form = useForm<VideoToGifFormValues>({
		resolver,
		defaultValues: {
			startSec: 0,
			durationSec: null,
			width: null,
			height: null,
			fps: 10,
		},
		mode: "onChange",
	});

	const { watch, reset } = form;

	// 메타 갱신 시 합리적 초깃값 부여
	useEffect(() => {
		if (!meta) return;
		const suggestedDuration = Math.max(0, Math.floor(meta.duration || 0));
		reset((prev) => ({
			...prev,
			startSec: 0,
			durationSec: suggestedDuration || null,
			width: meta.width || null,
			height: null,
			fps: 10,
		}));
	}, [meta, reset]);

	const allValues = watch();
	const startSec = allValues.startSec;
	const durationMax = useMemo(() => {
		if (!meta) return undefined;
		const remain = Math.max(0, (meta.duration || 0) - (startSec || 0));
		return Math.floor(remain);
	}, [meta, startSec]);

	const durationAll = meta?.duration ? Math.floor(meta.duration) : undefined;
	const nativeWidth = meta?.width || undefined;
	const nativeHeight = meta?.height || undefined;

	// 값 변경 시 상위로 전파(자동 저장)
	useEffect(() => {
		if (!onChange) return;
		const parsed = schema.safeParse(allValues);
		if (parsed.success) {
			onChange(parsed.data, true);
		} else {
			onChange(allValues as VideoToGifFormValues, false);
		}
	}, [allValues, onChange]);

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-4"
			>
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="startSec"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									시작 (초)
									{durationAll !== undefined && (
										<span className="text-xs text-muted-foreground">
											{" "}
											· 최대 {durationAll}
										</span>
									)}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										max={durationAll}
										value={field.value}
										onChange={(e) =>
											field.onChange(e.target.valueAsNumber || 0)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="durationSec"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									길이 (초, 빈칸=전체)
									{durationMax !== undefined && (
										<span className="text-xs text-muted-foreground">
											{" "}
											· 최대 {durationMax}
										</span>
									)}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										max={durationMax}
										value={field.value ?? ""}
										onChange={(e) => field.onChange(e.target.value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="width"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									너비 (px, 빈칸=원본)
									{nativeWidth && (
										<span className="text-xs text-muted-foreground">
											{" "}
											· 원본 {nativeWidth}
										</span>
									)}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										placeholder={nativeWidth ? String(nativeWidth) : undefined}
										value={field.value ?? ""}
										onChange={(e) => field.onChange(e.target.value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="height"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									높이 (px, 빈칸=자동)
									{nativeHeight && (
										<span className="text-xs text-muted-foreground">
											{" "}
											· 원본 {nativeHeight}
										</span>
									)}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										placeholder={
											nativeHeight ? String(nativeHeight) : undefined
										}
										value={field.value ?? ""}
										onChange={(e) => field.onChange(e.target.value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="fps"
						render={({ field }) => (
							<FormItem>
								<FormLabel>FPS</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										max={30}
										value={field.value}
										onChange={(e) =>
											field.onChange(e.target.valueAsNumber || 1)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 자동 저장: 별도 적용 버튼 없음 */}
			</form>
		</Form>
	);
}
