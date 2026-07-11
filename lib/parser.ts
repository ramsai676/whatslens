import type { ParsedChat, RawMessage } from './types';

/**
 * Parses WhatsApp chat exports (.txt) as produced by
 * "Export chat" on Android and iOS, across locales.
 *
 * Android:  12/07/2026, 10:45 pm - Ramesh: message
 *           12.07.26, 22:45 - Ramesh: message
 * iOS:      [12/07/26, 10:45:12 PM] Ramesh: message
 *
 * Handles: LTR/RTL marks, narrow no-break spaces, multi-line messages,
 * system messages (no sender), media markers, dd/mm vs mm/dd ambiguity.
 */

const INVISIBLES = /[‎‏‪-‮﻿]/g;
const NBSPACES = /[  ]/g;

// [12/07/26, 10:45:12 PM] Sender: text
const IOS_LINE =
  /^\[(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\]\s?(.*)$/i;

// 12/07/2026, 10:45 pm - Sender: text
const ANDROID_LINE =
  /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s+-\s(.*)$/i;

const MEDIA_MARKERS = [
  '<media omitted>',
  'image omitted',
  'video omitted',
  'audio omitted',
  'sticker omitted',
  'gif omitted',
  'document omitted',
  'contact card omitted',
  '<attached:',
];

const SYSTEM_SNIPPETS = [
  'messages and calls are end-to-end encrypted',
  'created group',
  'created this group',
  'added you',
  'you were added',
  'joined using this group',
  'left the group',
  'changed the subject',
  'changed this group',
  "changed the group's icon",
  'changed their phone number',
  'security code changed',
  'missed voice call',
  'missed video call',
  'blocked this contact',
  'unblocked this contact',
  'your security code with',
  'disappearing messages',
  'this message was deleted',
  'you deleted this message',
];

interface RawLine {
  d1: number;
  d2: number;
  year: number;
  hour: number;
  minute: number;
  second: number;
  meridiem: string | null;
  rest: string;
}

function matchLine(line: string): RawLine | null {
  const m = IOS_LINE.exec(line) ?? ANDROID_LINE.exec(line);
  if (!m) return null;
  return {
    d1: parseInt(m[1], 10),
    d2: parseInt(m[2], 10),
    year: parseInt(m[3], 10),
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
    second: m[6] ? parseInt(m[6], 10) : 0,
    meridiem: m[7] ? m[7].toLowerCase().replace(/\./g, '') : null,
    rest: m[8],
  };
}

/** Decide dd/mm vs mm/dd by scanning the whole file for an unambiguous line. */
function detectDayFirst(lines: RawLine[]): boolean {
  for (const l of lines) {
    if (l.d1 > 12) return true; // first component must be the day
    if (l.d2 > 12) return false; // second component must be the day
  }
  return true; // ambiguous throughout — default to dd/mm (most of the world)
}

function toEpoch(l: RawLine, dayFirst: boolean): number {
  const day = dayFirst ? l.d1 : l.d2;
  const month = dayFirst ? l.d2 : l.d1;
  const year = l.year < 100 ? 2000 + l.year : l.year;
  let hour = l.hour;
  if (l.meridiem === 'pm' && hour < 12) hour += 12;
  if (l.meridiem === 'am' && hour === 12) hour = 0;
  return new Date(year, month - 1, day, hour, l.minute, l.second).getTime();
}

function isMediaText(text: string): boolean {
  const t = text.trim().toLowerCase();
  return MEDIA_MARKERS.some((m) => t.includes(m));
}

function isSystemText(text: string): boolean {
  const t = text.toLowerCase();
  return SYSTEM_SNIPPETS.some((s) => t.includes(s));
}

/** Split "Sender: text" — sender names can contain colons only before emoji-free text, so split on first ": " */
function splitSender(rest: string): { sender: string; text: string } | null {
  const idx = rest.indexOf(': ');
  if (idx <= 0) {
    // trailing "Sender:" with empty text
    if (rest.endsWith(':')) return { sender: rest.slice(0, -1), text: '' };
    return null;
  }
  return { sender: rest.slice(0, idx), text: rest.slice(idx + 2) };
}

export function parseChatFile(fileName: string, content: string): ParsedChat {
  const cleaned = content.replace(NBSPACES, ' ');
  const lines = cleaned.split(/\r?\n/);

  // First pass: match timestamp lines (with invisibles stripped for matching)
  const rawLines: (RawLine | null)[] = lines.map((line) =>
    matchLine(line.replace(INVISIBLES, '').trimEnd())
  );
  const matched = rawLines.filter((l): l is RawLine => l !== null);
  const dayFirst = detectDayFirst(matched);

  const messages: RawMessage[] = [];
  let current: RawMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = rawLines[i];
    if (raw) {
      // flush previous
      if (current) messages.push(current);
      current = null;

      const split = splitSender(raw.rest);
      if (!split || (!split.sender && isSystemText(raw.rest))) {
        continue; // system message — no sender
      }
      if (isSystemText(raw.rest) && !split.text) continue;

      const text = split.text.replace(INVISIBLES, '');
      current = {
        ts: toEpoch(raw, dayFirst),
        sender: split.sender.replace(INVISIBLES, '').trim(),
        text,
        isMedia: isMediaText(text),
      };
    } else if (current) {
      // continuation of a multi-line message
      current.text += '\n' + lines[i].replace(INVISIBLES, '');
    }
  }
  if (current) messages.push(current);

  const participants = [...new Set(messages.map((m) => m.sender))];

  return {
    id: fileName + ':' + participants.join(','),
    fileName,
    name: chatNameFromFile(fileName),
    participants,
    isGroup: participants.length > 2,
    messages,
  };
}

function chatNameFromFile(fileName: string): string {
  return fileName
    .replace(/^whatsapp chat (with|-)\s*/i, '')
    .replace(/\.txt$/i, '')
    .replace(/\.zip$/i, '')
    .trim();
}

/**
 * The owner is the person exporting the chats: the sender who appears in the
 * most files (ties broken by total message count).
 */
export function detectOwner(chats: ParsedChat[]): string {
  const fileCount = new Map<string, number>();
  const msgCount = new Map<string, number>();
  for (const chat of chats) {
    for (const p of chat.participants) {
      fileCount.set(p, (fileCount.get(p) ?? 0) + 1);
    }
    for (const m of chat.messages) {
      msgCount.set(m.sender, (msgCount.get(m.sender) ?? 0) + m.text.length);
    }
  }
  let best = '';
  let bestScore = -1;
  for (const [p, files] of fileCount) {
    const score = files * 1_000_000 + (msgCount.get(p) ?? 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

/** Resolve the display name of the customer for a chat, given the owner. */
export function customerName(chat: ParsedChat, owner: string): string {
  if (chat.isGroup) return chat.name || chat.fileName;
  const other = chat.participants.find((p) => p !== owner);
  return other ?? chat.name ?? chat.fileName;
}
