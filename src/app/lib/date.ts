import { format, formatDistanceToNowStrict, isAfter, parseISO, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatKoreanDate(value: string) {
  return format(parseISO(value), 'yyyy.MM.dd', { locale: ko });
}

export function formatDateTime(value: string) {
  return format(parseISO(value), 'yyyy.MM.dd HH:mm', { locale: ko });
}

export function getDdayLabel(deadline: string) {
  const now = new Date();
  const target = parseISO(deadline);

  if (isAfter(now, target)) {
    return '마감됨';
  }

  return `D-${formatDistanceToNowStrict(target, { locale: ko, unit: 'day' }).replace('일', '')}`;
}

export function isWithinPeriod(value: string, period: '7d' | '30d' | 'all') {
  if (period === 'all') return true;

  const target = parseISO(value);
  const threshold = period === '7d' ? subDays(new Date(), 7) : subDays(new Date(), 30);
  return isAfter(target, threshold);
}
