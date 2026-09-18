export function fmtMoney(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d)\.)/g, ',');
}

export function fmtNum(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.floor(value) === value) return String(value);
  return String(Number(value.toFixed(2)));
}

export function fmtWhole(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d)$)/g, ' ');
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
