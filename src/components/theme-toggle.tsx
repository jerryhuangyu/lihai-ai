import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useThemeStore, type ThemeMode } from "@/store/useThemeStore";

const ICON: Record<ThemeMode, typeof MonitorIcon> = {
	system: MonitorIcon,
	light: SunIcon,
	dark: MoonIcon,
};

export function ThemeToggle() {
	const { t } = useTranslation("shell");
	const mode = useThemeStore((s) => s.mode);
	const cycle = useThemeStore((s) => s.cycle);
	const Icon = ICON[mode];
	const LABEL: Record<ThemeMode, string> = {
		system: t("theme.system"),
		light: t("theme.light"),
		dark: t("theme.dark"),
	};

	return (
		<Button aria-label={LABEL[mode]} size="icon-sm" variant="outline" onClick={cycle}>
			<Icon />
		</Button>
	);
}
