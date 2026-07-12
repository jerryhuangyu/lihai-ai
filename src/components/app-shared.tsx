import type { ReactNode } from "react";
import { LayoutGridIcon, BarChart3Icon, ListIcon } from "lucide-react";

export type SidebarNavItem = {
	title: string;
	to: string;
	icon: ReactNode;
};

export const navItems: SidebarNavItem[] = [
	{ title: "總覽", to: "/", icon: <LayoutGridIcon /> },
	{ title: "分析", to: "/analysis", icon: <BarChart3Icon /> },
	{ title: "Session", to: "/sessions", icon: <ListIcon /> },
];
