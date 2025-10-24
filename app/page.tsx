'use client';

import { useEffect, useMemo, useState } from "react";
import { ProductForm } from "@/components/ProductForm";
import { ProductTable } from "@/components/ProductTable";
import { ProductCsvImporter } from "@/components/ProductCsvImporter";
import {
  createEmptyProduct,
  productPayloadSchema,
  type Product,
  type ProductPayload,
} from "@/schema";

const cloneProduct = (product: Product): Product =>
  typeof structuredClone === "function"
    ? structuredClone(product)
    : (JSON.parse(JSON.stringify(product)) as Product);

type Theme = "light" | "dark";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Product | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("pdg-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("pdg-theme", theme);
  }, [theme]);

  useEffect(() => {
    setDraft(createEmptyProduct());
  }, []);

  const productCountLabel = useMemo(
    () => `${products.length} product${products.length === 1 ? "" : "s"}`,
    [products.length],
  );

  const resetForm = () => {
    setDraft(createEmptyProduct());
    setMode("create");
    setEditingId(null);
  };

  const handleAutofill = async (englishName: string) => {
    if (!englishName.trim()) return;
    setAutofillLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ englishName }),
      });

      const data = await res.json();
      if (!res.ok) {
        const details =
          typeof data?.details === "string"
            ? data.details
            : data?.details
              ? JSON.stringify(data.details)
              : null;
        const detailMessage = details ? ` Details: ${details.slice(0, 280)}` : "";
        throw new Error(`${data?.error ?? "Autofill service failed."}${detailMessage}`);
      }

      setDraft((current) => {
        const base = current ?? createEmptyProduct();
        return {
          ...base,
          description: data.description,
          effects: data.effects,
          sideEffects: data.sideEffects,
          goodFor: data.goodFor,
          updatedAt: new Date().toISOString(),
        };
      });
      setStatusMessage("Autofill succeeded. Review and adjust translations if needed.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Autofill failed unexpectedly.");
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleSubmit = (product: Product) => {
    const normalized: Product = {
      ...product,
      id: mode === "edit" && editingId ? editingId : product.id,
      pointValue: Number.isFinite(product.pointValue) ? Math.max(0, product.pointValue) : 0,
      tags: product.tags.map((tag) => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    if (mode === "edit" && editingId) {
      setProducts((previous) =>
        previous.map((item) => (item.id === editingId ? cloneProduct(normalized) : item)),
      );
    } else {
      setProducts((previous) => [...previous, cloneProduct(normalized)]);
    }

    setStatusMessage(mode === "edit" ? "Product updated." : "Product added.");
    setErrorMessage(null);
    setValidationIssues([]);
    resetForm();
  };

  const handleEdit = (product: Product) => {
    setDraft(cloneProduct(product));
    setMode("edit");
    setEditingId(product.id);
    setStatusMessage(`Editing "${product.name.en}"`);
    setErrorMessage(null);
  };

  const handleDelete = (id: string) => {
    setProducts((previous) => previous.filter((product) => product.id !== id));
    if (editingId === id) {
      resetForm();
    }
    setStatusMessage("Product removed.");
  };

  const handleImport = (imported: Product[]) => {
    setProducts((previous) => [...previous, ...imported.map((item) => cloneProduct(item))]);
    setStatusMessage(`Imported ${imported.length} product${imported.length === 1 ? "" : "s"} from CSV.`);
    setErrorMessage(null);
  };

  const handleDownload = async () => {
    const payload: ProductPayload = {
      products: products.map((product) => cloneProduct(product)),
      purchaseLog: [],
    };

    const localValidation = productPayloadSchema.safeParse(payload);
    if (!localValidation.success) {
      const issues = localValidation.error.issues.map((issue) => {
        const path = issue.path.join(".") || "(root)";
        return `${path}: ${issue.message}`;
      });
      setValidationIssues(issues);
      setErrorMessage("Validation failed. Please resolve the issues below before downloading.");
      return;
    }

    setValidationIssues([]);
    setErrorMessage(null);
    setStatusMessage("Validating with server...");

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.valid) {
        const serverIssues: string[] = Array.isArray(result?.issues)
          ? result.issues.map((issue: { message?: string; path?: (string | number)[] }) => {
              const path = Array.isArray(issue?.path) ? issue.path.join(".") : "(root)";
              return `${path}: ${issue?.message ?? "Invalid value"}`;
            })
          : ["Server validation failed."];
        setValidationIssues(serverIssues);
        setErrorMessage("Server validation failed. Check the issues list.");
        return;
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "catalog-import.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Download started. File: catalog-import.json");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to download JSON.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12 transition-colors dark:bg-slate-950">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8">
        <header className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Product Data Generator
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage catalog entries, enrich data with AI, and export validated JSON for your offline app.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {productCountLabel}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {validationIssues.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <p className="font-semibold">Validation issues:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {draft ? (
            <ProductForm
              product={draft}
              mode={mode}
              onChange={(next) => setDraft(cloneProduct(next))}
              onSubmit={handleSubmit}
              onReset={resetForm}
              onAutofill={handleAutofill}
              autofillLoading={autofillLoading}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
              Initializing form...
            </div>
          )}

          <div className="flex flex-col gap-6">
            <ProductCsvImporter onImport={handleImport} />

            <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleDownload}
              disabled={products.length === 0}
            >
              Download JSON
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
