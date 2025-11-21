export function compactFormat(value: number) {
  const formatter = new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(value);
}

export function standardFormat(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "0";
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return "0";
  // Use Indonesian locale formatting (thousand separator = '.') and no decimals
  try {
    return Math.round(numValue).toLocaleString('id-ID');
  } catch (e) {
    return String(Math.round(numValue));
  }
}