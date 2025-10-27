"use client";

import Link from "next/link";
import { useState } from "react";

const SAMPLE_LINE = JSON.stringify(
  {
    id: "b0c86df9-2dc4-4fb1-a68e-f49692ad9b1d",
    category: "health",
    pointValue: 120,
    tags: ["immune", "daily"],
    name: {
      ja: "免疫サポートカプセル",
      en: "Immune Support Capsules",
      th: "แคปซูลเสริมภูมิคุ้มกัน",
      ko: "면역 서포트 캡슐",
    },
    description: {
      ja: "日々の健康管理を支えるサプリメント。",
      en: "Daily supplement to support overall wellness.",
      th: "เสริมสุขภาพประจำวันของคุณ",
      ko: "하루 건강 관리를 돕는 영양제입니다.",
    },
    effects: {
      ja: "活力と抵抗力を保つのに役立ちます。",
      en: "Helps maintain energy and resilience.",
      th: "ช่วยคงพลังงานและภูมิต้านทาน",
      ko: "활력과 저항력을 유지하도록 돕습니다.",
    },
    sideEffects: {
      ja: "特別な副作用は報告されていません。",
      en: "No specific side effects reported.",
      th: "ยังไม่มีรายงานผลข้างเคียง",
      ko: "특별한 부작용 보고는 없습니다.",
    },
    goodFor: {
      ja: "季節の変わり目のセルフケアに。",
      en: "Perfect for seasonal self care.",
      th: "เหมาะสำหรับดูแลตัวเองช่วงเปลี่ยนฤดูกาล",
      ko: "환절기 셀프 케어에 적합합니다.",
    },
    updatedAt: new Date().toISOString(),
  },
  null,
  2,
);

type ImportSummary = {
  imported: number;
  skipped: number;
  errors: Array<{ line: number; message: string }>;
};

export default function ImportPage() {
  const [ndjson, setNdjson] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!ndjson.trim()) {
      setErrorMessage("Paste NDJSON lines before importing.");
      return;
    }

    setSubmitting(true);
    setSummary(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/x-ndjson" },
        body: ndjson,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(typeof data?.error === "string" ? data.error : "Import failed.");
        if (Array.isArray(data?.errors)) {
          setSummary({ imported: 0, skipped: data.errors.length, errors: data.errors });
        }
        return;
      }

      setSummary({
        imported: Number(data.imported ?? 0),
        skipped: Number(data.skipped ?? 0),
        errors: Array.isArray(data.errors) ? data.errors : [],
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import failed unexpectedly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">NDJSON Import</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Paste NDJSON lines below. Each line should be a product object. Valid rows commit in a single transaction and rebuild the bundle automatically.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label className="flex flex-col gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            NDJSON Lines
            <textarea
              className="min-h-[320px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-0 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder={SAMPLE_LINE}
              value={ndjson}
              onChange={(event) => setNdjson(event.target.value)}
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Importing…" : "Import"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setNdjson(SAMPLE_LINE)}
            >
              Paste sample
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Back to dashboard
            </Link>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {summary && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Import Summary</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Imported {summary.imported} line{summary.imported === 1 ? "" : "s"}. Skipped {summary.skipped}.
            </p>
            {summary.errors.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {summary.errors.map((entry) => (
                  <li
                    key={`${entry.line}-${entry.message}`}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                  >
                    Line {entry.line}: {entry.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                All lines imported successfully.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
