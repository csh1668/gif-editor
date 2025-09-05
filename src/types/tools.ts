import type { ComponentType } from "react";

export type ToolId = string;

export type ToolDefinition = {
	id: ToolId;
	label: string;
	description?: string;
	component: ComponentType;
};
