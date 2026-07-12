import { useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { navItems } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
	const { t } = useTranslation("shell");
	const { pathname } = useLocation();
	const activeItem = navItems.find((item) => (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to))) ?? navItems[0];
	// AppBreadcrumbs 只吃已解析好的顯示字串（title），故在此把 navItems 的翻譯 key 解析成當前語言文字。
	const page = { title: t(activeItem.titleKey), icon: activeItem.icon };

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
			)}
		>
			<DecorIcon className="hidden md:block" position="bottom-left" />
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={page} />
			</div>
			<div className="flex items-center gap-3">
				<LanguageToggle />
				<ThemeToggle />
			</div>
		</header>
	);
}
