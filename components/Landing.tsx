'use client';

import { useCallback, useRef, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import {
  CalendarIcon,
  ChatIcon,
  FlameIcon,
  LensMark,
  MoonZzIcon,
  ShieldIcon,
  UploadIcon,
} from './icons';

interface Props {
  onFiles: (files: File[]) => void;
  onDemo: () => void;
  error: string | null;
  busy: boolean;
}

export function Landing({ onFiles, onDemo, error, busy }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      onFiles(Array.from(e.dataTransfer.files));
    },
    [onFiles]
  );

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand)] text-white">
            <LensMark className="h-5 w-5" />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.01em]">WhatsLens</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ramsai/whatslens"
            className="text-sm text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* ——— Hero ——— */}
        <section className="hero-glow mx-auto max-w-2xl pt-14 text-center sm:pt-20">
          <p
            className="rise rise-1 mx-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium text-[var(--ink-2)]"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <ShieldIcon className="h-3.5 w-3.5 text-[var(--brand)]" />
            100% private — runs entirely in your browser
          </p>
          <h1 className="rise rise-2 mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[56px]">
            Your WhatsApp already knows your <span className="grad-text">best customers</span>.
          </h1>
          <p className="rise rise-3 mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-[var(--ink-2)]">
            Drop your chat exports and WhatsLens shows you the VIPs, the dormant customers worth
            winning back, the hot leads waiting for a reply — everything your chats have been
            trying to tell you.
          </p>
        </section>

        {/* ——— Dropzone ——— */}
        <section className="rise rise-4 mx-auto mt-10 max-w-2xl">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload WhatsApp chat exports"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current++;
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (--dragDepth.current === 0) setDragOver(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`dropzone card-lift ${dragOver ? 'drag-over' : ''} group cursor-pointer rounded-2xl border-2 border-dashed px-8 py-12 text-center`}
            style={{
              borderColor: dragOver ? 'var(--brand)' : 'var(--hairline-strong)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.zip"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              <UploadIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[15px] font-medium">
              {busy ? 'Reading your chats…' : 'Drop WhatsApp chat exports here'}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">
              .txt or .zip · one file per customer chat · nothing leaves this device
            </p>
          </div>

          {error && (
            <p
              className="overlay-enter mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--critical)', color: 'var(--critical)' }}
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--ink-3)]">
            <span>No exports handy?</span>
            <button
              onClick={onDemo}
              className="pressable font-medium text-[var(--brand)] underline-offset-4 hover:underline"
            >
              Explore the demo — a jeweler with 10 customers →
            </button>
          </div>
        </section>

        {/* ——— What it finds ——— */}
        <section className="rise rise-5 mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: <MoonZzIcon className="h-5 w-5" />,
              color: 'var(--serious)',
              title: 'Dormant VIPs',
              body: 'Customers who spent big, then went quiet. Each one is a win-back message away.',
            },
            {
              icon: <FlameIcon className="h-5 w-5" />,
              color: 'var(--good)',
              title: 'Hot leads',
              body: 'People asking about price, stock and delivery right now — ranked so none slip through.',
            },
            {
              icon: <CalendarIcon className="h-5 w-5" />,
              color: 'var(--series-blue)',
              title: 'Life events',
              body: 'Weddings, birthdays, anniversaries mentioned in passing. Every one is a future sale.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card-lift rounded-2xl border p-6"
              style={{
                borderColor: 'var(--hairline)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ color: f.color, background: 'color-mix(in srgb, currentColor 12%, transparent)' }}>
                {f.icon}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-2)]">{f.body}</p>
            </div>
          ))}
        </section>

        {/* ——— How to export ——— */}
        <section className="rise rise-6 mx-auto mt-16 max-w-2xl pb-24">
          <details
            className="group rounded-2xl border px-6 py-5"
            style={{ borderColor: 'var(--hairline)', background: 'var(--surface)' }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium">
              <span className="flex items-center gap-2.5">
                <ChatIcon className="h-5 w-5 text-[var(--ink-3)]" />
                How do I export a chat from WhatsApp?
              </span>
              <span className="text-[var(--ink-3)] transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink-2)]">
              <p>
                <strong className="text-[var(--ink)]">Android:</strong> open a customer chat → tap ⋮ →
                More → Export chat → <em>Without media</em>. Share the file to your computer, then drop
                it here.
              </p>
              <p>
                <strong className="text-[var(--ink)]">iPhone:</strong> open a customer chat → tap the
                contact name → Export Chat → <em>Without Media</em>.
              </p>
              <p>
                Export a handful of your busiest customer chats — the more you add, the sharper the
                picture. Group chats work too.
              </p>
              <p className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: 'var(--brand-soft)' }}>
                <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
                <span>
                  Your chats are parsed locally in this tab and never uploaded. Close the tab and
                  they are gone. The code is open source — verify it yourself.
                </span>
              </p>
            </div>
          </details>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-[13px] text-[var(--ink-3)]" style={{ borderColor: 'var(--hairline)' }}>
        WhatsLens · open source under MIT · built for small businesses everywhere
      </footer>
    </div>
  );
}
