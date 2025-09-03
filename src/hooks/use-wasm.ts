import init, { greet } from "@pkg/gif_editor.js";
import { useEffect } from "react";

export default function useWasm() {
	useEffect(() => {
		(async () => {
			await init();
		})();
	}, []);

	return {
		greet,
	};
}
