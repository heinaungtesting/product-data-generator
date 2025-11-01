"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductForm } from "@/components/ProductForm";
import { ProductTable } from "@/components/ProductTable";
import { createEmptyProduct, type Product } from "@pdg/schema";

const CATEGORY_OPTIONS: Product["category"][] = ["health", "cosmetic"];

type ValidationIssue = {
  path: (string | number)[];
  message: string;
};

const mapIssuesToErrors = (issues: ValidationIssue[]) => {
  const errors: Record<string, string> = {};
  issues.forEach((issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "__root";
    errors[key] = issue.message;
  });
  return errors;
};

const formatCountLabel = (count: number) => `${count} product${count === 1 ? "" : "s"}`;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Product["category"][]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [draft, setDraft] = useState<Product>(() => createEmptyProduct());
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [draftRecovery, setDraftRecovery] = useState<{ updatedAt: string; payload: Product } | null>(null);

  const autosaveSkipRef = useRef(true);
  const searchDebounceRef = useRef<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set("search", search);
      }
      selectedCategories.forEach((category) => params.append("category", category));
      selectedTags.forEach((tag) => params.append("tag", tag));
      const query = params.toString();
      const response = await fetch(`/api/products${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Product fetch failed (${response.status})`);
      }
      const data = (await response.json()) as {
        products?: Product[];
        availableTags?: string[];
      };
      setProducts(data.products ?? []);
      setAvailableTags(data.availableTags ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, selectedTags]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    if (autosaveSkipRef.current) {
      autosaveSkipRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        await fetch(`/api/drafts/${draft.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal: controller.signal,
        });
        setAutosaveStatus(`Draft saved ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Autosave draft failed", error);
        setAutosaveStatus("Autosave failed. Changes are not stored.");
      }
    }, 800);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [draft]);

  const resetForm = useCallback(({ preserveStatus = false }: { preserveStatus?: boolean } = {}) => {
    autosaveSkipRef.current = true;
    setDraft(createEmptyProduct());
    setMode("create");
    setEditingId(null);
    setValidationErrors({});
    setFormError(null);
    if (!preserveStatus) {
      setStatusMessage(null);
    }
    setAutosaveStatus(null);
    setDraftRecovery(null);
  }, []);

  const toggleCategory = (category: Product["category"]) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((value) => value !== category) : [...prev, category],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchInput("");
    setSearch("");
  };

  const handleDraftChange = (next: Product) => {
    setDraft(next);
    setFormError(null);
    setStatusMessage(null);
    setAutosaveStatus("Unsaved changes…");
  };

  const handleClearValidation = (paths: string[]) => {
    if (paths.length === 0) {
      setValidationErrors({});
      setFormError(null);
      return;
    }
    setValidationErrors((current) => {
      const next = { ...current };
      paths.forEach((path) => {
        if (path === "__root") {
          setFormError(null);
        }
        delete next[path];
        const prefix = `${path}.`;
        Object.keys(next).forEach((key) => {
          if (key.startsWith(prefix)) {
            delete next[key];
          }
        });
      });
      return next;
    });
  };

  const handleAutofill = async (englishName: string) => {
    if (!englishName.trim()) return;

    setAutofillLoading(true);
    setFormError(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ englishName }),
      });
      const data = await response.json();

      if (!response.ok) {
        const detail = typeof data?.details === "string" ? data.details : undefined;
        const errorMessage = data?.error ?? "Autofill service failed.";
        throw new Error(detail ? `${errorMessage} Details: ${detail.slice(0, 180)}` : errorMessage);
      }

      setDraft((current) => ({
        ...current,
        description: data.description,
        effects: data.effects,
        sideEffects: data.sideEffects,
        goodFor: data.goodFor,
        updatedAt: new Date().toISOString(),
      }));
      setStatusMessage("Autofill complete. Please review translations before saving.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Autofill failed unexpectedly.");
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleSave = async (product: Product) => {
    const payload = { ...product, updatedAt: new Date().toISOString() };
    setValidationErrors({});
    setFormError(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const issues = Array.isArray(data?.issues) ? (data.issues as ValidationIssue[]) : null;
        if (issues && issues.length > 0) {
          const errors = mapIssuesToErrors(issues);
          const root = errors.__root;
          if (root) {
            setFormError(root);
            delete errors.__root;
          } else {
            setFormError("Validation failed. Review highlighted fields.");
          }
          setValidationErrors(errors);
        } else {
          setFormError(typeof data?.error === "string" ? data.error : "Unable to save product.");
        }
        return;
      }

      setStatusMessage(mode === "edit" ? "Product updated successfully." : "Product created successfully.");
      autosaveSkipRef.current = true;
      resetForm({ preserveStatus: true });
      await fetchProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save product.");
    }
  };

  const handleDelete = async (id: string) => {
    setFormError(null);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(typeof data?.error === "string" ? data.error : "Failed to delete product.");
        return;
      }
      if (editingId === id) {
        autosaveSkipRef.current = true;
        resetForm({ preserveStatus: false });
      }
      setStatusMessage("Product deleted.");
      await fetchProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to delete product.");
    }
  };

  const handleEdit = async (product: Product) => {
    autosaveSkipRef.current = true;
    setDraft(product);
    setMode("edit");
    setEditingId(product.id);
    setValidationErrors({});
    setFormError(null);
    setStatusMessage(`Editing “${product.name.ja || product.name.en}”`);
    setAutosaveStatus(null);
    setDraftRecovery(null);

    try {
      const response = await fetch(`/api/drafts/${product.id}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const draftRecord = data?.draft as { updatedAt: string; blob: Product } | null;
      if (!draftRecord) {
        return;
      }
      const draftUpdatedAt = new Date(draftRecord.updatedAt).getTime();
      const productUpdatedAt = new Date(product.updatedAt).getTime();
      if (Number.isFinite(draftUpdatedAt) && draftUpdatedAt > productUpdatedAt) {
        setDraftRecovery({ updatedAt: draftRecord.updatedAt, payload: draftRecord.blob });
      }
    } catch (error) {
      console.warn("Failed to load draft", error);
    }
  };

  const restoreDraft = () => {
    if (!draftRecovery) return;
    autosaveSkipRef.current = true;
    setDraft(draftRecovery.payload);
    setDraftRecovery(null);
    setStatusMessage("Draft restored from autosave.");
    setAutosaveStatus("Unsaved changes…");
  };

  const dismissDraftRecovery = () => {
    setDraftRecovery(null);
  };

  const productCountLabel = useMemo(() => formatCountLabel(products.length), [products.length]);

  return (
    <div className="min-h-screen bg-slate-100 py-8 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Data Generator</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Local product catalog manager with offline support. Max 100 items for optimal performance.
            </p>
          </div>
          <div className="inline-flex gap-3">
            <Link
              href="/api/export"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              download
            >
              Export Data
            </Link>
            <Link
              href="/bundle/latest"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Download Bundle
            </Link>
            <Link
              href="/import"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              Paste NDJSON Import
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex-1">
                  <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Search
                    <input
                      type="search"
                      placeholder="Search name, description, effects…"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{productCountLabel}</span>
                  {loadError ? <span className="text-red-500">{loadError}</span> : null}
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          selectedCategories.includes(category)
                            ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200"
                            : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.length === 0 ? (
                      <span className="text-xs text-slate-400">No tags yet</span>
                    ) : (
                      availableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            selectedTags.includes(tag)
                              ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200"
                              : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {tag}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ProductTable
              products={products}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage={search || selectedCategories.length || selectedTags.length ? "No products match your filters." : "No products yet. Add your first product using the form."}
            />
          </div>

          <div className="space-y-4">
            {draftRecovery ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
                <p className="font-semibold">Draft available</p>
                <p className="mt-1">
                  A newer autosave from {new Date(draftRecovery.updatedAt).toLocaleString()} is available.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={restoreDraft}
                    className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-500"
                  >
                    Restore Draft
                  </button>
                  <button
                    type="button"
                    onClick={dismissDraftRecovery}
                    className="rounded-md border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500 dark:text-amber-200 dark:hover:bg-amber-800/40"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}

            <ProductForm
              product={draft}
              mode={mode}
              onChange={handleDraftChange}
              onSubmit={handleSave}
              onReset={() => resetForm()}
              onAutofill={handleAutofill}
              autofillLoading={autofillLoading}
              validationErrors={validationErrors}
              formError={formError}
              statusMessage={statusMessage}
              autosaveStatus={autosaveStatus}
              onClearValidation={handleClearValidation}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
