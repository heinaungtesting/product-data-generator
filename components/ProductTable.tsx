import type { Product } from "@/schema";

type ProductTableProps = {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
};

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No products yet. Add your first product using the form.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3 text-left">Name (EN)</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Points</th>
            <th className="px-4 py-3 text-left">Tags</th>
            <th className="px-4 py-3 text-left">Updated</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                {product.name.en}
              </td>
              <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                {product.category}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {product.pointValue}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                {product.tags.join(", ")}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                {new Date(product.updatedAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                    onClick={() => onDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
