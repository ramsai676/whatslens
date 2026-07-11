import { unzipSync, strFromU8 } from 'fflate';
import { parseChatFile, detectOwner } from './parser';
import type { ParsedChat } from './types';

/**
 * Ingest dropped/selected files entirely in the browser.
 * Accepts .txt exports and .zip archives (WhatsApp "Export chat" produces
 * a zip when media is attached).
 */
export async function ingestFiles(files: File[]): Promise<ParsedChat[]> {
  const texts: { name: string; content: string }[] = [];

  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.zip')) {
      const buf = new Uint8Array(await file.arrayBuffer());
      const entries = unzipSync(buf, {
        filter: (f) => f.name.toLowerCase().endsWith('.txt'),
      });
      for (const [name, data] of Object.entries(entries)) {
        texts.push({ name: baseName(name), content: strFromU8(data) });
      }
    } else if (lower.endsWith('.txt')) {
      texts.push({ name: file.name, content: await file.text() });
    }
  }

  return texts
    .map((t) => parseChatFile(t.name, t.content))
    .filter((c) => c.messages.length > 0);
}

function baseName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export { detectOwner };
