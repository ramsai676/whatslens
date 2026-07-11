'use client';

import { useCallback, useState } from 'react';
import { Landing } from '@/components/Landing';
import { Dashboard } from '@/components/Dashboard';
import { ingestFiles } from '@/lib/ingest';
import { parseChatFile, detectOwner } from '@/lib/parser';
import { SAMPLE_FILES } from '@/lib/sample-data';
import type { ParsedChat } from '@/lib/types';

type Stage =
  | { kind: 'landing' }
  | { kind: 'dashboard'; chats: ParsedChat[]; owner: string; isDemo: boolean };

export default function Home() {
  const [stage, setStage] = useState<Stage>({ kind: 'landing' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    setBusy(true);
    setError(null);
    try {
      const chats = await ingestFiles(files);
      if (chats.length === 0) {
        setError(
          "Couldn't find any messages in those files. Export a chat from WhatsApp (⋮ → More → Export chat → Without media) and drop the .txt or .zip here."
        );
        return;
      }
      setStage({ kind: 'dashboard', chats, owner: detectOwner(chats), isDemo: false });
    } catch (e) {
      setError('Something went wrong reading those files. Make sure they are WhatsApp chat exports (.txt or .zip).');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDemo = useCallback(() => {
    const chats = SAMPLE_FILES.map((f) => parseChatFile(f.name, f.content));
    setStage({ kind: 'dashboard', chats, owner: detectOwner(chats), isDemo: true });
  }, []);

  const handleReset = useCallback(() => {
    setStage({ kind: 'landing' });
    setError(null);
  }, []);

  const handleOwnerChange = useCallback((owner: string) => {
    setStage((s) => (s.kind === 'dashboard' ? { ...s, owner } : s));
  }, []);

  if (stage.kind === 'dashboard') {
    return (
      <Dashboard
        chats={stage.chats}
        owner={stage.owner}
        isDemo={stage.isDemo}
        onOwnerChange={handleOwnerChange}
        onReset={handleReset}
      />
    );
  }

  return <Landing onFiles={handleFiles} onDemo={handleDemo} error={error} busy={busy} />;
}
