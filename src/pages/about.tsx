import { Button } from "@/components/ui/button";
import useWasm from "@/hooks/use-wasm";

export default function About() {
	const wasm = useWasm();

	return (
		<div>
			<h1 className="text-xl font-semibold">About</h1>
			<p className="text-sm text-gray-600">This is a sample route.</p>
			<Button onClick={() => wasm.greet()}>Click me</Button>
		</div>
	);
}
