import { LanguagesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
	const { t, i18n } = useTranslation("shell");
	const isZh = i18n.language.startsWith("zh");

	return (
		<Button
			aria-label={t("toggleLanguage")}
			size="icon-sm"
			variant="outline"
			onClick={() => i18n.changeLanguage(isZh ? "en" : "zh")}
		>
			<LanguagesIcon />
		</Button>
	);
}
