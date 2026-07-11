import { parseChatFile, detectOwner, customerName } from '../lib/parser';
import { analyzeDataset } from '../lib/analytics';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

function assertEq<T>(actual: T, expected: T, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) console.error(`    expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  assert(ok, label);
}

// ---------- Android 12h format (Indian default) ----------
const androidChat = [
  '12/07/2025, 10:45 am - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.',
  '12/07/2025, 10:45 am - Priya Sharma: Hi, do you have gold bangles in stock?',
  '12/07/2025, 10:52 am - Ram Jewellers: Yes madam, new designs arrived yesterday',
  '12/07/2025, 10:53 am - Priya Sharma: What is the rate today?',
  '12/07/2025, 11:05 am - Ram Jewellers: <Media omitted>',
  '13/07/2025, 9:15 pm - Priya Sharma: My daughter wedding is in November',
  'we need full bridal set',
  'budget around 5 lakhs',
  '13/07/2025, 9:20 pm - Ram Jewellers: Congratulations! Please visit the shop, we will show you our bridal collection',
].join('\n');

console.log('Android 12h format');
{
  const chat = parseChatFile('WhatsApp Chat with Priya Sharma.txt', androidChat);
  assertEq(chat.messages.length, 6, 'parses 6 messages, skips system line');
  assertEq(chat.participants.length, 2, 'two participants');
  assert(!chat.isGroup, 'not a group');
  assertEq(chat.name, 'Priya Sharma', 'chat name from file name');
  const multiline = chat.messages[4];
  assert(multiline.text.includes('bridal set') && multiline.text.includes('5 lakhs'), 'multi-line message joined');
  const d = new Date(chat.messages[0].ts);
  assertEq([d.getDate(), d.getMonth() + 1, d.getFullYear(), d.getHours()], [12, 7, 2025, 10], 'dd/mm 12h am parsed');
  const pm = new Date(chat.messages[4].ts);
  assertEq(pm.getHours(), 21, '9:15 pm → 21h');
  assert(chat.messages[3].isMedia, '<Media omitted> flagged as media');
}

// ---------- iOS format with invisible marks + narrow nbsp ----------
const iosChat = [
  '‎[25/12/24, 6:30:15 PM] Rahul Verma: ‎image omitted',
  '[25/12/24, 6:31:02 PM] Rahul Verma: Bhai is design ka price kitna hai',
  '[25/12/24, 6:45:30 PM] Ram Jewellers: 45,000 sir, hallmark included',
  '[26/12/24, 11:00:00 AM] Rahul Verma: ok I am interested, will come Saturday',
].join('\n');

console.log('iOS format');
{
  const chat = parseChatFile('WhatsApp Chat - Rahul Verma.txt', iosChat);
  assertEq(chat.messages.length, 4, 'parses 4 iOS messages');
  assert(chat.messages[0].isMedia, 'iOS image omitted flagged');
  const d = new Date(chat.messages[1].ts);
  assertEq([d.getDate(), d.getMonth() + 1, d.getFullYear(), d.getHours(), d.getMinutes()], [25, 12, 2024, 18, 31], 'iOS dd/mm/yy 12h pm with U+202F parsed');
  assertEq(chat.messages[1].sender, 'Rahul Verma', 'sender clean of invisibles');
}

// ---------- Android 24h format, mm/dd disambiguation ----------
const usChat = [
  '12/25/24, 14:30 - Store: Merry Christmas! Holiday sale is on',
  '12/26/24, 09:15 - Customer: what are the offers?',
].join('\n');

console.log('mm/dd disambiguation');
{
  const chat = parseChatFile('chat.txt', usChat);
  const d = new Date(chat.messages[0].ts);
  assertEq([d.getDate(), d.getMonth() + 1], [25, 12], 'detects mm/dd when first component > 12');
  assertEq(d.getHours(), 14, '24h time parsed');
}

// ---------- Owner detection across files ----------
console.log('Owner detection');
{
  const c1 = parseChatFile('a.txt', androidChat);
  const c2 = parseChatFile('b.txt', iosChat.replace(/Ram Jewellers/g, 'Ram Jewellers'));
  const owner = detectOwner([c1, c2]);
  assertEq(owner, 'Ram Jewellers', 'owner = sender common to all files');
  assertEq(customerName(c1, owner), 'Priya Sharma', 'customer name resolved');
}

// ---------- Analytics ----------
console.log('Analytics');
{
  const c1 = parseChatFile('WhatsApp Chat with Priya Sharma.txt', androidChat);
  const c2 = parseChatFile('WhatsApp Chat - Rahul Verma.txt', iosChat);
  const owner = detectOwner([c1, c2]);
  const ds = analyzeDataset([c1, c2], owner);
  assertEq(ds.customers.length, 2, 'two customers analyzed');
  const priya = ds.customers.find((c) => c.name === 'Priya Sharma')!;
  assert(priya.intents.length >= 2, `Priya has intent messages (stock/rate/budget) — got ${priya.intents.length}`);
  assert(priya.events.some((e) => e.keyword === 'wedding'), 'wedding event detected');
  const rahul = ds.customers.find((c) => c.name === 'Rahul Verma')!;
  assert(rahul.intents.some((i) => i.text.includes('kitna')), 'Hinglish intent message (kitna) detected');
  assert(rahul.awaitingReply, 'Rahul last message unanswered → awaitingReply');
  assert(ds.asOf === Math.max(...[c1, c2].flatMap((c) => c.messages.map((m) => m.ts))), 'asOf = latest message');
  assert(ds.totals.messages === 10, `total messages = 10, got ${ds.totals.messages}`);
  assert(priya.score > 0 && priya.score <= 100, 'score in range');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
