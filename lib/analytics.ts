import type {
  Badge,
  CustomerAnalysis,
  DatasetAnalysis,
  EventMention,
  IntentMessage,
  MonthBucket,
  ParsedChat,
  RawMessage,
} from './types';
import { customerName } from './parser';

const DAY = 24 * 60 * 60 * 1000;

/** Buying-intent signals — English + Hinglish, tuned for Indian SMB chats. */
const INTENT_KEYWORDS = [
  'price',
  'rate',
  'cost',
  'how much',
  'kitna',
  'kitne',
  'kya bhav',
  'bhav',
  'order',
  'book',
  'booking',
  'buy',
  'purchase',
  'chahiye',
  'available',
  'stock',
  'delivery',
  'deliver',
  'discount',
  'offer',
  'final price',
  'best price',
  'payment',
  'advance',
  'upi',
  'gpay',
  'phonepe',
  'paytm',
  'emi',
  'gold rate',
  'silver rate',
  'interested',
  'confirm',
  'weight',
  'gram',
  'tola',
  'carat',
  'catalog',
  'catalogue',
  'send photo',
  'photo bhejo',
  'new design',
  'invoice',
  'bill',
  'quotation',
  'quote',
];

/** Life events — each one is a future sale with a date on it. */
const EVENT_KEYWORDS = [
  'wedding',
  'shaadi',
  'shadi',
  'marriage',
  'engagement',
  'sagai',
  'birthday',
  'anniversary',
  'muhurtham',
  'muhurat',
  'naming ceremony',
  'griha pravesh',
  'housewarming',
  'akshaya tritiya',
  'dhanteras',
  'diwali',
  'function',
];

/** Gap that separates two conversations. */
const CONVO_GAP = 6 * 60 * 60 * 1000;
const DORMANT_DAYS = 60;
const HOT_LEAD_DAYS = 14;
const NEW_CUSTOMER_DAYS = 30;

function findKeyword(text: string, keywords: string[]): string | null {
  const t = text.toLowerCase();
  for (const k of keywords) {
    if (t.includes(k)) return k;
  }
  return null;
}

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Build a contiguous month series from `from` to `to` (inclusive). */
function buildMonths(from: number, to: number): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const d = new Date(from);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  while (d.getTime() <= end.getTime()) {
    buckets.push({
      key: monthKey(d.getTime()),
      label: MONTH_LABELS[d.getMonth()],
      count: 0,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return buckets;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function analyzeCustomer(
  chat: ParsedChat,
  owner: string,
  asOf: number,
  monthsFrom: number
): CustomerAnalysis {
  const msgs = chat.messages;
  const name = customerName(chat, owner);
  const fromOwnerMsgs = msgs.filter((m) => m.sender === owner);
  const fromCustomerMsgs = msgs.filter((m) => m.sender !== owner);

  const firstTs = msgs.length ? msgs[0].ts : asOf;
  const lastTs = msgs.length ? msgs[msgs.length - 1].ts : asOf;
  const daysSinceLast = Math.floor((asOf - lastTs) / DAY);

  // Intent + event detection (customer messages only — the owner quoting a
  // price is not the customer showing intent)
  const intents: IntentMessage[] = [];
  const events: EventMention[] = [];
  for (const m of fromCustomerMsgs) {
    if (m.isMedia) continue;
    const ik = findKeyword(m.text, INTENT_KEYWORDS);
    if (ik) intents.push({ ts: m.ts, text: m.text, keyword: ik });
    const ek = findKeyword(m.text, EVENT_KEYWORDS);
    if (ek) events.push({ ts: m.ts, text: m.text, keyword: ek });
  }

  // Conversations + who initiates them
  let conversations = 0;
  let customerInitiated = 0;
  let prevTs = -Infinity;
  for (const m of msgs) {
    if (m.ts - prevTs > CONVO_GAP) {
      conversations++;
      if (m.sender !== owner) customerInitiated++;
    }
    prevTs = m.ts;
  }

  // Owner response time: customer message → next owner message within 48h
  const responseTimes: number[] = [];
  for (let i = 0; i < msgs.length - 1; i++) {
    if (msgs[i].sender !== owner && msgs[i + 1].sender === owner) {
      const delta = msgs[i + 1].ts - msgs[i].ts;
      if (delta < 48 * 60 * 60 * 1000) responseTimes.push(delta / 60000);
    }
  }

  // Monthly activity
  const monthly = buildMonths(monthsFrom, asOf);
  const byKey = new Map(monthly.map((b) => [b.key, b]));
  for (const m of msgs) {
    const b = byKey.get(monthKey(m.ts));
    if (b) b.count++;
  }

  // Engagement score, 0–100:
  //   volume (30) — log-scaled message count
  //   intent (30) — buying-intent messages, saturating at 8
  //   recency (25) — exponential decay, half-life ~45 days
  //   initiative (15) — share of conversations the customer starts
  const volume = Math.min(1, Math.log10(1 + msgs.length) / Math.log10(300)) * 30;
  const intent = Math.min(1, intents.length / 8) * 30;
  const recency = Math.exp((-Math.LN2 * daysSinceLast) / 45) * 25;
  const initiative = (conversations ? customerInitiated / conversations : 0) * 15;
  const score = Math.round(volume + intent + recency + initiative);

  const last = msgs.length ? msgs[msgs.length - 1] : null;
  const awaitingReply = !!last && last.sender !== owner && !last.isMedia;

  return {
    id: chat.id,
    name,
    fileName: chat.fileName,
    isGroup: chat.isGroup,
    totalMessages: msgs.length,
    fromCustomer: fromCustomerMsgs.length,
    fromOwner: fromOwnerMsgs.length,
    firstTs,
    lastTs,
    daysSinceLast,
    score,
    badges: [], // assigned at dataset level (needs cross-customer context)
    intents,
    events,
    monthly,
    ownerResponseMinutes: median(responseTimes),
    customerInitiated,
    conversations,
    lastMessage: last ? { ts: last.ts, sender: last.sender, text: last.text } : null,
    awaitingReply,
  };
}

/** Historical engagement ignoring recency — used to spot dormant VIPs. */
function historicalValue(c: CustomerAnalysis): number {
  const volume = Math.min(1, Math.log10(1 + c.totalMessages) / Math.log10(300)) * 50;
  const intent = Math.min(1, c.intents.length / 8) * 50;
  return volume + intent;
}

function assignBadges(customers: CustomerAnalysis[], asOf: number): void {
  const sorted = [...customers].sort((a, b) => b.score - a.score);
  const vipCutoff = Math.max(1, Math.ceil(sorted.length * 0.25));
  const vips = new Set(sorted.slice(0, vipCutoff).map((c) => c.id));

  for (const c of customers) {
    const badges: Badge[] = [];
    const dormant = c.daysSinceLast >= DORMANT_DAYS;
    const highValue = historicalValue(c) >= 40;

    if (dormant && highValue) badges.push('dormant-vip');
    else if (vips.has(c.id) && !dormant) badges.push('vip');

    const recentIntent = c.intents.some((i) => asOf - i.ts <= HOT_LEAD_DAYS * DAY);
    if (recentIntent) badges.push('hot-lead');

    if (asOf - c.firstTs <= NEW_CUSTOMER_DAYS * DAY) badges.push('new');
    if (c.awaitingReply) badges.push('unanswered');

    c.badges = badges;
  }
}

export function analyzeDataset(chats: ParsedChat[], owner: string): DatasetAnalysis {
  const nonEmpty = chats.filter((c) => c.messages.length > 0);
  const allTs = nonEmpty.flatMap((c) => [c.messages[0].ts, c.messages[c.messages.length - 1].ts]);
  const asOf = allTs.length ? Math.max(...allTs) : Date.now();
  const firstTs = allTs.length ? Math.min(...allTs) : asOf;
  // Chart window: up to 18 months back
  const monthsFrom = Math.max(firstTs, asOf - 548 * DAY);

  const customers = nonEmpty
    .map((chat) => analyzeCustomer(chat, owner, asOf, monthsFrom))
    .sort((a, b) => b.score - a.score);

  assignBadges(customers, asOf);

  const monthly = buildMonths(monthsFrom, asOf);
  const byKey = new Map(monthly.map((b) => [b.key, b]));
  for (const c of customers) {
    for (const b of c.monthly) {
      const target = byKey.get(b.key);
      if (target) target.count += b.count;
    }
  }

  return {
    owner,
    asOf,
    customers,
    totals: {
      customers: customers.length,
      messages: customers.reduce((s, c) => s + c.totalMessages, 0),
      intents: customers.reduce((s, c) => s + c.intents.length, 0),
      dormantVips: customers.filter((c) => c.badges.includes('dormant-vip')).length,
      hotLeads: customers.filter((c) => c.badges.includes('hot-lead')).length,
      awaitingReply: customers.filter((c) => c.awaitingReply).length,
      firstTs,
      lastTs: asOf,
    },
    monthly,
  };
}

export function formatDaysAgo(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} mo ago`;
  return `${(days / 365).toFixed(1)} yr ago`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
