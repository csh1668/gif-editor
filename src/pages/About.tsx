import init, { greet } from "@pkg/gif_editor.js";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function About() {
	useEffect(() => {
		(async () => {
			await init();
		})();
	}, []);
	return (
		<div>
			<h1 className="text-xl font-semibold">About</h1>
			<p className="text-sm text-gray-600">This is a sample route.</p>
			<Button onClick={() => greet()}>Click me</Button>
		</div>
	);
}
