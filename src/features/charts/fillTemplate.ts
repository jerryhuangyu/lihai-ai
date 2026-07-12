// 純字串樣板代入（非 i18next interpolation）：builder 需保持 pure，
// 故翻譯後的樣板字串在此用簡單 regex 代入 tooltip 當下才知道的動態數值。
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}
