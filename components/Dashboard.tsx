'use client';

import { useMemo, useState } from 'react';
import { analyzeDataset, formatDate, formatDaysAgo } from '@/lib/analytics';
import type { CustomerAnalysis, ParsedChat } from '@/lib/types';
import { BadgeRow } from './Badges';
import { ActivityChart, Sparkline } from './charts';
import { CustomerDetail } from './CustomerDetail';
import { ThemeToggle } from './ThemeToggle';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, FlameIcon, LensMark, MoonZzIcon, SparkleIcon } from './icons';

interface Props {
  chats: ParsedChat[];
  owner: string;
  isDemo: boolean;
  onOwnerChange: (owner: string) => void;
  onReset: () => void;
}

function Card({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{
        borderColor: 'var(--hairline)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[var(--ink-2)]">{label}</p>
        {icon && <span style={{ color: accent ?? 'var(--ink-3)' }}>{icon}</span>}
      </div>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.01em]">
        {value.toLocaleString('en-IN')}
      </p>
    </Card>
  );
}

export function Dashboard({ chats, owner, isDemo, onOwnerChange, onReset }: Props) {
  const analysis = useMemo(() => analyzeDataset(chats, owner), [chats, owner]);
  const [selected, setSelected] = useState<CustomerAnalysis | null>(null);

  const ownerCandidates = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of chats) for (const p of c.participants) count.set(p, (count.get(p) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
  }, [chats]);

  const { totals, customers, monthly } = analysis;
  const dormantVips = customers.filter((c) => c.badges.includes('dormant-vip'));
  const awaiting = customers.filter((c) => c.awaitingReply);
  const upcomingEvents = customers
    .flatMap((c) => c.events.map((e) => ({ customer: c, event: e })))
    .sort((a, b) => b.event.ts - a.event.ts)
    .slice(0, 4);

  return (
    <div className="min-h-screen pb-20">
      {/* ——— top bar ——— */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--hairline)', background: 'color-mix(in srgb, var(--page) 85%, transparent)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onReset}
              className="pressable flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)]"
              style={{ borderColor: 'var(--hairline)' }}
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              New analysis
            </button>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--brand)] text-white">
                <LensMark className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.01em]">WhatsLens</span>
            </span>
            {isDemo && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
              >
                Demo data
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="hidden items-center gap-2 text-[13px] text-[var(--ink-3)] md:flex">
              You are
              <select
                value={owner}
                onChange={(e) => onOwnerChange(e.target.value)}
                className="rounded-lg border bg-transparent px-2 py-1 text-[13px] font-medium text-[var(--ink)]"
                style={{ borderColor: 'var(--hairline)', background: 'var(--surface)' }}
              >
                {ownerCandidates.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* ——— headline ——— */}
        <section className="rise rise-1 pt-8">
          <h1 className="text-2xl font-semibold tracking-[-0.015em]">{owner}</h1>
          <p className="mt-1 text-[15px] text-[var(--ink-2)]">
            {totals.customers} customers · {totals.messages.toLocaleString('en-IN')} messages ·{' '}
            {formatDate(totals.firstTs)} – {formatDate(totals.lastTs)}
          </p>
        </section>

        {/* ——— stat tiles ——— */}
        <section className="rise rise-2 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Customers" value={totals.customers} />
          <StatTile label="Buying signals" value={totals.intents} accent="var(--good-text)" icon={<SparkleIcon className="h-4 w-4" />} />
          <StatTile label="Hot leads" value={totals.hotLeads} accent="var(--good-text)" icon={<FlameIcon className="h-4 w-4" />} />
          <StatTile label="Dormant VIPs" value={totals.dormantVips} accent="var(--serious-text)" icon={<MoonZzIcon className="h-4 w-4" />} />
          <StatTile label="Awaiting reply" value={totals.awaitingReply} accent="var(--critical)" icon={<ClockIcon className="h-4 w-4" />} />
        </section>

        {/* ——— insight cards ——— */}
        <section className="rise rise-3 mt-3 grid gap-3 lg:grid-cols-3">
          {/* win-back */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--serious-text)' }}>
              <MoonZzIcon className="h-4 w-4" /> Worth winning back
            </h2>
            {dormantVips.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-3)]">No dormant VIPs — your best customers are all active.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {dormantVips.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c)}
                      className="pressable w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--page)]"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[var(--ink-3)]"> — quiet {formatDaysAgo(c.daysSinceLast)}, {c.intents.length} past buying signals</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* awaiting reply */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--critical)' }}>
              <ClockIcon className="h-4 w-4" /> Waiting on you
            </h2>
            {awaiting.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-3)]">Inbox zero — nobody is waiting on a reply.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {awaiting.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c)}
                      className="pressable w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--page)]"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[var(--ink-3)]">
                        {' '}
                        — “{(c.lastMessage?.text ?? '').slice(0, 44)}
                        {(c.lastMessage?.text ?? '').length > 44 ? '…' : ''}”
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* events */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--series-blue)' }}>
              <CalendarIcon className="h-4 w-4" /> Life events
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-3)]">No weddings, birthdays or anniversaries mentioned yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcomingEvents.map(({ customer: c, event: e }, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setSelected(c)}
                      className="pressable w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--page)]"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[var(--ink-3)]"> — mentioned “{e.keyword}” on {formatDate(e.ts)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* ——— activity chart ——— */}
        <section className="rise rise-4 mt-3">
          <Card className="p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--ink-2)]">
              Conversation volume
            </h2>
            <div className="mt-4">
              <ActivityChart data={monthly} />
            </div>
          </Card>
        </section>

        {/* ——— customer table ——— */}
        <section className="rise rise-5 mt-3">
          <Card className="overflow-hidden">
            <div className="flex items-baseline justify-between px-5 pt-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--ink-2)]">
                Customers by engagement
              </h2>
              <p className="text-[12px] text-[var(--ink-3)]">click a row for the full picture</p>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]" style={{ borderColor: 'var(--grid)' }}>
                  <th className="py-2.5 pl-5 pr-3 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Trend</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Msgs</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Signals</th>
                  <th className="px-3 py-2.5 text-right font-medium">Last active</th>
                  <th className="py-2.5 pl-3 pr-5 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-[var(--page)]"
                    style={{ borderColor: 'var(--grid)' }}
                  >
                    <td className="py-3 pl-5 pr-3 text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {i + 1}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 hidden lg:inline-block align-middle">
                        <BadgeRow badges={c.badges} max={2} />
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <Sparkline data={c.monthly.slice(-12)} />
                    </td>
                    <td className="hidden px-3 py-3 text-right text-[var(--ink-2)] sm:table-cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.totalMessages}
                    </td>
                    <td className="hidden px-3 py-3 text-right sm:table-cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.intents.length > 0 ? (
                        <span style={{ color: 'var(--good-text)' }}>{c.intents.length}</span>
                      ) : (
                        <span className="text-[var(--ink-3)]">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--ink-2)]">{formatDaysAgo(c.daysSinceLast)}</td>
                    <td className="py-3 pl-3 pr-5">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full" style={{ background: 'var(--grid)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${c.score}%`, background: 'var(--brand)' }}
                          />
                        </div>
                        <span className="w-7 text-right font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {c.score}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        <p className="rise rise-6 mt-6 text-center text-[12px] text-[var(--ink-3)]">
          Analysis as of {formatDate(analysis.asOf)} (latest message in your export) · all processing stayed in this tab
        </p>
      </main>

      {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
