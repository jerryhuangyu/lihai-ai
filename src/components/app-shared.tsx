import type { ReactNode } from "react";
import { LayoutGridIcon, BarChart3Icon, ListIcon } from "lucide-react";

/** shell namespace 底下 nav.* 翻譯 key 的字面量聯集,讓 t(item.titleKey) 能通過 i18next 產生的型別檢查。 */
type NavTitleKey = "nav.overview" | "nav.analysis" | "nav.sessions";

export type SidebarNavItem = {
	/** shell namespace 翻譯 key,由消費端 useTranslation('shell') 解析成顯示文字。 */
	titleKey: NavTitleKey;
	to: string;
	icon: ReactNode;
};

export const navItems: SidebarNavItem[] = [
	{ titleKey: "nav.overview", to: "/", icon: <LayoutGridIcon /> },
	{ titleKey: "nav.analysis", to: "/analysis", icon: <BarChart3Icon /> },
	{ titleKey: "nav.sessions", to: "/sessions", icon: <ListIcon /> },
];
