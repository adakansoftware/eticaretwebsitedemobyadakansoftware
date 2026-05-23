export function toCsvRow(values: Array<string | number | null | undefined>) {
  return values
    .map((value) => {
      const normalized = String(value ?? "");
      const escaped = normalized.replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(",");
}

export function toCsvContent(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");
}
