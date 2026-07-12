"use client";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navItems } from "@/components/app-shared";

export function AppSidebar() {
	const matchRoute = useMatchRoute();

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2">
				<SidebarMenuButton render={<Link to="/" />}><LogoIcon /><span className="font-medium text-foreground!">AI Usage</span></SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu className="p-2">
					{navItems.map((item) => (
						<SidebarMenuItem key={item.to}>
							<SidebarMenuButton
								isActive={!!matchRoute({ to: item.to })}
								render={<Link to={item.to} />}
							>{item.icon}<span>{item.title}</span></SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="p-0">
				<div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
					<p className="text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} AI Usage Dashboard
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
