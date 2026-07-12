"use client";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { navItems } from "@/components/app-shared";
import { Logo, LogoIcon } from "@/components/logo";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
	const { t } = useTranslation("shell");
	const matchRoute = useMatchRoute();

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2">
				<SidebarMenuButton className="gap-4" render={<Link to="/" />}>
					<LogoIcon className="h-6! w-auto! group-data-[collapsible=icon]:h-4!" />
					<Logo className="h-3.5! w-auto! text-foreground group-data-[collapsible=icon]:hidden" />
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu className="p-2">
					{navItems.map((item) => (
						<SidebarMenuItem key={item.to}>
							<SidebarMenuButton
								isActive={!!matchRoute({ to: item.to })}
								render={<Link to={item.to} />}
							>
								{item.icon}
								<span>{t(item.titleKey)}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="p-0">
				<div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
					<p className="text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} LiHai Usage Dashboard
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
