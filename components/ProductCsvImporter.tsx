import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LANGUAGES, createEmptyProduct } from "@/schema";

type ProductCsvImporterProps = {
  onImport: (products: ReturnType<typeof createEmptyProduct>[]) => void;
};

const REQUIRED_COLUMNS = ["name_en", "category", "pointValue", "tags"] as const;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      current.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      current.push(cell);
      rows.push(current);
      current = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }

  return rows.filter((row) => row.some((value) => value.trim().length > 0));
}

export function ProductCsvImporter({ onImport }: ProductCsvImporterProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setInfo(null);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        throw new Error("CSV file is empty.");
      }
      const [headerRow, ...dataRows] = rows;
      const headers = headerRow.map((column) => column.trim());

      for (const required of REQUIRED_COLUMNS) {
        if (!headers.includes(required)) {
          throw new Error(`Missing required column: ${required}`);
        }
      }

      const imported = dataRows.map((row) => {
        const record: Record<string, string> = {};
        headers.forEach((column, index) => {
          record[column] = row[index]?.trim() ?? "";
        });

        const base = createEmptyProduct();
        base.name.en = record.name_en;
        for (const lang of LANGUAGES.filter((lang) => lang !== "en")) {
          const localized = record[`name_${lang}`] ?? "";
          base.name[lang] = localized || record.name_en || base.name[lang];
        }
        base.category = record.category === "cosmetic" ? "cosmetic" : "health";
        base.pointValue = Number.parseInt(record.pointValue, 10) || 0;
        base.tags = record.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        base.updatedAt = new Date().toISOString();
        return base;
      });

      onImport(imported);
      setInfo(`Imported ${imported.length} product(s) from CSV.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            CSV Import (optional)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Columns: name_en, category, pointValue, tags
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => inputRef.current?.click()}
        >
          Upload CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      {info && <p className="text-xs text-green-600">{info}</p>}
    </div>
  );
}
