export function sliceByDate<T extends { date: string }>(rows: T[], range: { from: string; to: string }): T[] {
  return rows.filter((r) => r.date >= range.from && r.date <= range.to)
}

export function sliceKpis(
  dailyCost: { date: string; cost: number }[],
  range: { from: string; to: string },
): { totalCost: number; avgPerDay: number; deltaPct: number } {
  const rows = sliceByDate(dailyCost, range).sort((a, b) => a.date.localeCompare(b.date))
  const totalCost = rows.reduce((a, r) => a + r.cost, 0)
  const avgPerDay = rows.length ? totalCost / rows.length : 0
  let deltaPct = 0
  if (rows.length >= 2) {
    const prev = rows[rows.length - 2].cost
    const last = rows[rows.length - 1].cost
    deltaPct = prev > 0 ? ((last - prev) / prev) * 100 : 0
  }
  return { totalCost, avgPerDay, deltaPct }
}
