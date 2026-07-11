import type { Badge } from '@/lib/types';
import { CalendarIcon, ClockIcon, FlameIcon, MoonZzIcon, SparkleIcon } from './icons';

// Status colors carry state; every badge pairs icon + label so color is
// never the only channel.
const BADGE_SPEC: Record<Badge, { label: string; color: string; icon: React.ReactNode }> = {
  vip: {
    label: 'VIP',
    color: 'var(--violet)',
    icon: <SparkleIcon className="h-3 w-3" />,
  },
  'dormant-vip': {
    label: 'Dormant VIP',
    color: 'var(--serious-text)',
    icon: <MoonZzIcon className="h-3 w-3" />,
  },
  'hot-lead': {
    label: 'Hot lead',
    color: 'var(--good-text)',
    icon: <FlameIcon className="h-3 w-3" />,
  },
  new: {
    label: 'New',
    color: 'var(--series-blue)',
    icon: <CalendarIcon className="h-3 w-3" />,
  },
  unanswered: {
    label: 'Awaiting reply',
    color: 'var(--critical)',
    icon: <ClockIcon className="h-3 w-3" />,
  },
};

export function BadgeChip({ badge }: { badge: Badge }) {
  const spec = BADGE_SPEC[badge];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: spec.color,
        background: 'color-mix(in srgb, currentColor 10%, transparent)',
      }}
    >
      {spec.icon}
      {spec.label}
    </span>
  );
}

export function BadgeRow({ badges, max = 3 }: { badges: Badge[]; max?: number }) {
  if (badges.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {badges.slice(0, max).map((b) => (
        <BadgeChip key={b} badge={b} />
      ))}
    </span>
  );
}
