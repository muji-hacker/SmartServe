export function formatPrice(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDuration(startedAt, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) return `${hours}h ${remainder}m`;
  if (minutes < 1) return 'Just started';
  return `${remainder}m`;
}
