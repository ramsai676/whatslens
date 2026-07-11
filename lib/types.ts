export interface RawMessage {
  ts: number; // epoch ms
  sender: string;
  text: string;
  isMedia: boolean;
}

export interface ParsedChat {
  id: string;
  fileName: string;
  /** Display name of the chat partner (or group) */
  name: string;
  participants: string[];
  isGroup: boolean;
  messages: RawMessage[];
}

export type Badge = 'vip' | 'dormant-vip' | 'hot-lead' | 'new' | 'unanswered';

export interface IntentMessage {
  ts: number;
  text: string;
  keyword: string;
}

export interface EventMention {
  ts: number;
  text: string;
  keyword: string;
}

export interface MonthBucket {
  /** e.g. "2026-03" */
  key: string;
  label: string; // e.g. "Mar"
  count: number;
}

export interface CustomerAnalysis {
  id: string;
  name: string;
  fileName: string;
  isGroup: boolean;
  totalMessages: number;
  fromCustomer: number;
  fromOwner: number;
  firstTs: number;
  lastTs: number;
  daysSinceLast: number;
  /** 0–100 */
  score: number;
  badges: Badge[];
  intents: IntentMessage[];
  events: EventMention[];
  monthly: MonthBucket[];
  /** median minutes the owner takes to reply; null if unknowable */
  ownerResponseMinutes: number | null;
  /** conversations (gap > 6h) started by the customer */
  customerInitiated: number;
  conversations: number;
  lastMessage: { ts: number; sender: string; text: string } | null;
  /** true when the last message is from the customer and unanswered */
  awaitingReply: boolean;
}

export interface DatasetAnalysis {
  owner: string;
  asOf: number; // epoch ms of latest message across dataset
  customers: CustomerAnalysis[];
  totals: {
    customers: number;
    messages: number;
    intents: number;
    dormantVips: number;
    hotLeads: number;
    awaitingReply: number;
    firstTs: number;
    lastTs: number;
  };
  monthly: MonthBucket[];
}
