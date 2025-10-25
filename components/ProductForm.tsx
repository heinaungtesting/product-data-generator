import { useMemo } from "react";
import type { FormEvent } from "react";
import type { Product } from "@/schema";
import { LANGUAGES, createEmptyProduct } from "@/schema";

const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  en: "English",
  zh: "Chinese",
  ko: "Korean",
  th: "Thai",
};

const FIELD_GROUPS: Array<{
  key: "name" | "description" | "effects" | "sideEffects" | "goodFor";
  label: string;
  multiline?: boolean;
}> = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description", multiline: true },
  { key: "effects", label: "Effects", multiline: true },
  { key: "sideEffects", label: "Side Effects", multiline: true },
  { key: "goodFor", label: "Good For", multiline: true },
];

type ProductFormProps = {
  product: Product;
  mode: "create" | "edit";
  onChange: (product: Product) => void;
  onSubmit: (product: Product) => void;
  onReset: () => void;
  onAutofill: (englishName: string) => Promise<void>;
  autofillLoading?: boolean;
};

export function ProductForm({
  product,
  mode,
  onChange,
  onSubmit,
  onReset,
  onAutofill,
  autofillLoading = false,
}: ProductFormProps) {
  const tagsValue = useMemo(() => product.tags.join(", "), [product.tags]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(product);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {mode === "create" ? "Add Product" : "Edit Product"}
        </h2>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          ID: {product.id}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Category
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={product.category}
            onChange={(event) =>
              onChange({ ...product, category: event.target.value as Product["category"] })
            }
          >
            <option value="health">Health</option>
            <option value="cosmetic">Cosmetic</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Point Value
          <input
            type="number"
            min={0}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={product.pointValue}
            onChange={(event) =>
              onChange({ ...product, pointValue: Number.parseInt(event.target.value, 10) || 0 })
            }
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Tags (comma separated)
          <input
            type="text"
            placeholder="energy, immune, daily"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={tagsValue}
            onChange={(event) =>
              onChange({
                ...product,
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      </div>

      <div className="grid gap-6">
        {FIELD_GROUPS.map(({ key, label, multiline }) => (
          <div key={key} className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {label}
              </span>
              {key === "name" && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => onAutofill(product.name.en)}
                  disabled={!product.name.en.trim() || autofillLoading}
                >
                  {autofillLoading ? "Autofilling..." : "Autofill"}
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {LANGUAGES.map((lang) => {
                const value = product[key][lang];
                const labelForLang = LANGUAGE_LABELS[lang];
                const inputId = `${key}-${lang}`;

                return (
                  <label
                    key={lang}
                    htmlFor={inputId}
                    className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
                  >
                    {labelForLang}
                    {multiline ? (
                      <textarea
                        id={inputId}
                        className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        value={value}
                        onChange={(event) =>
                          onChange({
                            ...product,
                            [key]: {
                              ...product[key],
                              [lang]: event.target.value,
                            },
                          })
                        }
                        rows={3}
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        className="min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        value={value}
                        onChange={(event) =>
                          onChange({
                            ...product,
                            [key]: {
                              ...product[key],
                              [lang]: event.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Updated At (ISO 8601)
          <input
            type="text"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={product.updatedAt}
            onChange={(event) => onChange({ ...product, updatedAt: event.target.value })}
          />
        </label>
        <button
          type="button"
          className="h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() =>
            onChange({
              ...product,
              updatedAt: new Date().toISOString(),
            })
          }
        >
          Set to Now
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === "create" ? "Add Product" : "Update Product"}
        </button>
        {mode === "create" && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => onChange(createEmptyProduct())}
          >
            Reset Form
          </button>
        )}
        {mode === "edit" && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
            onClick={onReset}
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
}
