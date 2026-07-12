import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore, type ThemeMode } from "@/store/useThemeStore";

const LABEL: Record<ThemeMode, string> = {
	system: "主題：跟隨系統",
	light: "主題：淺色",
	dark: "主題：深色",
};

const ICON: Record<ThemeMode, typeof MonitorIcon> = {
	system: MonitorIcon,
	light: SunIcon,
	dark: MoonIcon,
};

export function ThemeToggle() {
	const mode = useThemeStore((s) => s.mode);
	const cycle = useThemeStore((s) => s.cycle);
	const Icon = ICON[mode];

	return (
		<Button aria-label={LABEL[mode]} size="icon-sm" variant="outline" onClick={cycle}>
			<Icon />
		</Button>
	);
}
