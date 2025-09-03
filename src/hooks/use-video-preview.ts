import { useEffect, useRef, useState } from "react";

export default function useVideoPreview(file: File | null): string | null {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const objectUrlRef = useRef<string | null>(null);

	useEffect(() => {
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}
		if (file) {
			const url = URL.createObjectURL(file);
			objectUrlRef.current = url;
			setPreviewUrl(url);
		} else {
			setPreviewUrl(null);
		}
		return () => {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = null;
			}
		};
	}, [file]);

	return previewUrl;
}
