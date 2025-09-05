import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultToolId, findToolById, tools } from "@/config/tools";

export default function App() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeToolId = searchParams.get("tool") ?? defaultToolId;
	const activeTool = useMemo(
		() => findToolById(activeToolId) ?? findToolById(defaultToolId),
		[activeToolId],
	);

	return (
		<Tabs
			value={activeToolId}
			onValueChange={(value: string) => setSearchParams({ tool: value })}
			className="flex flex-col gap-4"
		>
			<TabsList className="w-fit self-center">
				{tools.map((t) => (
					<TabsTrigger key={t.id} value={t.id} title={t.description}>
						{t.label}
					</TabsTrigger>
				))}
			</TabsList>

			{tools.map((t) => (
				<TabsContent key={t.id} value={t.id} className="mt-0">
					{activeTool?.id === t.id ? <activeTool.component /> : null}
				</TabsContent>
			))}
		</Tabs>
	);
}
