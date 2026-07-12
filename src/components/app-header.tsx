import { useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { navItems } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
	const { pathname } = useLocation();
	const page = navItems.find((item) => (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to))) ?? navItems[0];

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
				<ThemeToggle />
			</div>
		</header>
	);
}
