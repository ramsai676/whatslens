'use client';

import { useEffect } from 'react';
import type { CustomerAnalysis } from '@/lib/types';
import { formatDate, formatDaysAgo } from '@/lib/analytics';
import { BadgeRow } from './Badges';
import { MonthBars } from './charts';
import { XIcon } from './icons';

interface Props {
  customer: CustomerAnalysis;
  onClose: () => void;
}

function suggestedAction(c: CustomerAnalysis): string | null {
  if (c.badges.includes('dormant-vip')) {
    return `High-value customer, quiet for ${c.daysSinceLast} days. A personal message — new arrivals, a festival greeting, anything human — tends to win these back.`;
  }
  if (c.badges.includes('unanswered')) {
    return `Their last message is still waiting on a reply (${formatDaysAgo(
      c.daysSinceLast
    )}). Answer it before a competitor does.`;
  }
  if (c.badges.includes('hot-lead')) {
    const latest = c.intents[c.intents.length - 1];
    return `Asked about “${latest?.keyword}” recently. This is a live enquiry — a quick, specific reply usually closes it.`;
  }
  if (c.events.length > 0) {
    const e = c.events[c.events.length - 1];
    return `Mentioned a ${e.keyword} — occasions like this are where loyal customers are made. A thoughtful follow-up lands well.`;
  }
  return null;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]">{label}</p>
      <p className="mt-0.5 text-[15px] font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  );
}

export function CustomerDetail({ customer: c, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const action = suggestedAction(c);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Customer ${c.name}`}>
      <div className="overlay-enter absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        className="panel-enter absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col overflow-y-auto border-l"
        style={{ background: 'var(--surface)', borderColor: 'var(--hairline)', boxShadow: 'var(--shadow-panel)' }}
      >
        {/* header */}
        <div className="sticky top-0 z-10 border-b px-6 py-5" style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em]">{c.name}</h2>
              <div className="mt-1.5">
                <BadgeRow badges={c.badges} max={4} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {c.score}
                </p>
                <p className="text-[11px] text-[var(--ink-3)]">score</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="pressable grid h-8 w-8 place-items-center rounded-full border text-[var(--ink-2)]"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-7 px-6 py-6">
          {action && (
            <p
              className="rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={{ background: 'var(--brand-soft)', color: 'var(--ink)' }}
            >
              <span className="font-semibold text-[var(--brand)]">Next move: </span>
              {action}
            </p>
          )}

          {/* quick stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Stat label="Messages" value={`${c.totalMessages} (${c.fromCustomer} from them)`} />
            <Stat
              label="Median reply time"
              value={
                c.ownerResponseMinutes === null
                  ? '—'
                  : c.ownerResponseMinutes < 60
                    ? `${Math.round(c.ownerResponseMinutes)} min`
                    : `${(c.ownerResponseMinutes / 60).toFixed(1)} hr`
              }
            />
            <Stat label="Customer since" value={formatDate(c.firstTs)} />
            <Stat label="Last active" value={formatDaysAgo(c.daysSinceLast)} />
            <Stat label="Conversations" value={c.conversations} />
            <Stat label="Started by them" value={c.customerInitiated} />
          </div>

          {/* activity */}
          <section>
            <h3 className="mb-3 text-[13px] font-semibold text-[var(--ink-2)]">Activity — last 12 months</h3>
            <MonthBars data={c.monthly} />
          </section>

          {/* buying signals */}
          {c.intents.length > 0 && (
            <section>
              <h3 className="mb-3 text-[13px] font-semibold text-[var(--ink-2)]">
                Buying signals ({c.intents.length})
              </h3>
              <ul className="space-y-2.5">
                {c.intents
                  .slice(-5)
                  .reverse()
                  .map((m, i) => (
                    <li
                      key={i}
                      className="rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed"
                      style={{ borderColor: 'var(--hairline)' }}
                    >
                      <p className="line-clamp-2 text-[var(--ink)]">“{m.text}”</p>
                      <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                        <span className="font-medium" style={{ color: 'var(--good-text)' }}>
                          {m.keyword}
                        </span>{' '}
                        · {formatDate(m.ts)}
                      </p>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* life events */}
          {c.events.length > 0 && (
            <section>
              <h3 className="mb-3 text-[13px] font-semibold text-[var(--ink-2)]">Life events mentioned</h3>
              <ul className="space-y-2.5">
                {c.events
                  .slice(-3)
                  .reverse()
                  .map((e, i) => (
                    <li
                      key={i}
                      className="rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed"
                      style={{ borderColor: 'var(--hairline)' }}
                    >
                      <p className="line-clamp-2">“{e.text}”</p>
                      <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                        <span className="font-medium" style={{ color: 'var(--series-blue)' }}>
                          {e.keyword}
                        </span>{' '}
                        · {formatDate(e.ts)}
                      </p>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* last message */}
          {c.lastMessage && (
            <section className="pb-4">
              <h3 className="mb-3 text-[13px] font-semibold text-[var(--ink-2)]">Last message</h3>
              <div className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--page)' }}>
                <p className="line-clamp-3 leading-relaxed">“{c.lastMessage.text}”</p>
                <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                  {c.lastMessage.sender} · {formatDate(c.lastMessage.ts)}
                </p>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
