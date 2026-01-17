export function formatCurrencyK(value: number | string | undefined | null) {
  const n = Number(value || 0);
  if (isNaN(n)) return "0K";
  const intPart = Math.trunc(n);
  return `${intPart}K`;
}

export default formatCurrencyK;
