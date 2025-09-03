import init from "@pkg/gif_editor.js";
import { useEffect } from "react";
import VideoToGif from "./components/VideoToGif";

function App() {
	useEffect(() => {
		(async () => {
			await init();
		})();
	}, []);

	return <VideoToGif />;
}

export default App;
