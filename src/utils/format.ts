export function formatDate(value?: number | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}
