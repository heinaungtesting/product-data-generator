import { useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import type { Product } from "@/schema";
import { LANGUAGES, createEmptyProduct } from "@/schema";

const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  ja: "Japanese",
  en: "English",
  th: "Thai",
  ko: "Korean",
  zh: "Chinese",
};

const LANGUAGE_FLAGS: Record<(typeof LANGUAGES)[number], string> = {
  en: "🇺🇸",
  zh: "🇨🇳",
  ko: "🇰🇷",
  th: "🇹🇭",
  ja: "🇯🇵",
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
  validationErrors?: Record<string, string>;
  formError?: string | null;
  statusMessage?: string | null;
  autosaveStatus?: string | null;
  onClearValidation?: (paths: string[]) => void;
};

export function ProductForm({
  product,
  mode,
  onChange,
  onSubmit,
  onReset,
  onAutofill,
  autofillLoading = false,
  validationErrors,
  formError,
  statusMessage,
  autosaveStatus,
  onClearValidation,
}: ProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const localizedErrorKeys = useMemo(() => {
    const keys = new Set<string>();
    FIELD_GROUPS.forEach(({ key }) => {
      LANGUAGES.forEach((lang) => keys.add(`${key}.${lang}`));
    });
    // Add warnings keys
    LANGUAGES.forEach((lang) => keys.add(`warnings.${lang}`));
    return keys;
  }, []);
  const tagsValue = useMemo(() => product.tags.join(", "), [product.tags]);
  const generalErrors = useMemo(
    () =>
      validationErrors
        ? Object.entries(validationErrors)
            .filter(([key]) => !localizedErrorKeys.has(key))
            .map(([key, message]) => ({ key, message }))
        : [],
    [validationErrors, localizedErrorKeys],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(product);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", product.id);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange({ ...product, image: data.path });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange({ ...product, image: undefined });
  };

  const clearFieldError = (paths: string[]) => {
    if (onClearValidation) {
      onClearValidation(paths);
    }
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
        {mode === "edit" ? (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            ID: {product.id}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            New product
          </span>
        )}
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
            onChange={(event) => {
              clearFieldError(["pointValue"]);
              onChange({
                ...product,
                pointValue: Number.parseInt(event.target.value, 10) || 0,
              });
            }}
            />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Tags (comma separated)
          <input
            type="text"
            placeholder="energy, immune, daily"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={tagsValue}
            onChange={(event) => {
              const tags = event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
              clearFieldError(["tags"]);
              onChange({
                ...product,
                tags,
              });
            }}
          />
        </label>
      </div>

      {/* Product Image Upload */}
      <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Product Image
        </span>
        
        {product.image ? (
          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900">
              <img
                src={product.image}
                alt="Product preview"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-900/20">
              <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                📷 Click to upload or drag & drop
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                JPG, PNG, WebP (max 5MB)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploading && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Uploading image...
              </p>
            )}
            {uploadError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        )}
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
                const errorKey = `${key}.${lang}`;
                const fieldError = validationErrors?.[errorKey];

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
                        aria-invalid={Boolean(fieldError)}
                        className={`min-h-[90px] rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-0 dark:bg-slate-900 dark:text-slate-100 ${
                          fieldError
                            ? "border-red-400 dark:border-red-500"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
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
                        onFocus={() => clearFieldError([errorKey])}
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        aria-invalid={Boolean(fieldError)}
                        className={`min-h-11 rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-0 dark:bg-slate-900 dark:text-slate-100 ${
                          fieldError
                            ? "border-red-400 dark:border-red-500"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
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
                        onFocus={() => clearFieldError([errorKey])}
                      />
                    )}
                    {fieldError && (
                      <span className="text-[11px] font-semibold text-red-500 dark:text-red-400">
                        {fieldError}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Warnings Field */}
        <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Warnings / Safety Information
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {LANGUAGES.map((lang) => {
              const value = product.warnings?.[lang] || "";
              const labelForLang = LANGUAGE_LABELS[lang];
              const flag = LANGUAGE_FLAGS[lang];
              const inputId = `warnings-${lang}`;
              const errorKey = `warnings.${lang}`;
              const fieldError = validationErrors?.[errorKey];

              return (
                <label
                  key={lang}
                  htmlFor={inputId}
                  className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
                >
                  <span className="flex items-center gap-1">
                    <span>{flag}</span>
                    <span>{labelForLang}</span>
                  </span>
                  <textarea
                    id={inputId}
                    aria-invalid={Boolean(fieldError)}
                    placeholder="e.g., Do not take if pregnant..."
                    className={`min-h-[90px] rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-0 dark:bg-slate-900 dark:text-slate-100 ${
                      fieldError
                        ? "border-red-400 dark:border-red-500"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                    value={value}
                    onChange={(event) =>
                      onChange({
                        ...product,
                        warnings: {
                          ...product.warnings,
                          [lang]: event.target.value,
                        },
                      })
                    }
                    rows={3}
                    onFocus={() => clearFieldError([errorKey])}
                  />
                  {fieldError && (
                    <span className="text-[11px] font-semibold text-red-500 dark:text-red-400">
                      {fieldError}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Updated At (ISO 8601)
          <input
            type="text"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={product.updatedAt}
            onChange={(event) => {
              clearFieldError(["updatedAt"]);
              onChange({ ...product, updatedAt: event.target.value });
            }}
            />
        </label>
        <button
          type="button"
          className="h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() => {
            clearFieldError(["updatedAt"]);
            onChange({
              ...product,
              updatedAt: new Date().toISOString(),
            });
          }}
        >
          Set to Now
        </button>
      </div>

      {(formError || statusMessage || autosaveStatus || generalErrors.length > 0) && (
        <div className="space-y-2 text-sm">
          {formError && (
            <div className="rounded-lg border border-red-300 bg-red-100/70 px-3 py-2 font-medium text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
              {formError}
            </div>
          )}
          {generalErrors.length > 0 && (
            <ul className="space-y-1 text-xs text-red-500 dark:text-red-400">
              {generalErrors.map(({ key, message }) => (
                <li key={key}>
                  <span className="font-semibold">{key}:</span> {message}
                </li>
              ))}
            </ul>
          )}
          {statusMessage && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {statusMessage}
            </div>
          )}
          {autosaveStatus && (
            <div className="text-xs text-slate-500 dark:text-slate-400">{autosaveStatus}</div>
          )}
        </div>
      )}

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
