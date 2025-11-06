'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { LogEntry, Product } from '@/lib/db';

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const allLogs = await db.logs.toArray();
        const allProducts = await db.products.toArray();
        setLogs(allLogs);
        setProducts(allProducts);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleClearLogs = async () => {
    if (confirm('Clear all logs? This cannot be undone.')) {
      await db.logs.clear();
      setLogs([]);
    }
  };

  const handleFixLogNames = async () => {
    if (!confirm('Fix all log entries with missing product names? This will update all entries.')) {
      return;
    }

    let fixed = 0;
    const allLogs = await db.logs.toArray();

    for (const log of allLogs) {
      if (!log.productName || log.productName === '' || log.productName === 'Unknown') {
        const product = await db.products.get(log.productId);
        if (product) {
          const newName = product.name.en || product.name.ja || 'Unknown Product';
          await db.logs.update(log.id!, { productName: newName });
          fixed++;
        }
      }
    }

    alert(`Fixed ${fixed} log entries`);

    // Reload
    const updatedLogs = await db.logs.toArray();
    setLogs(updatedLogs);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Debug Database</h1>
          <div className="space-x-2">
            <button
              onClick={handleFixLogNames}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Fix Log Names
            </button>
            <button
              onClick={handleClearLogs}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Products */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Products ({products.length})</h2>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Names</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{p.id.slice(0, 8)}</td>
                    <td className="p-2">
                      <div className="space-y-1">
                        {Object.entries(p.name).map(([lang, name]) => (
                          <div key={lang}>
                            <span className="font-bold text-slate-500">{lang}:</span> {name || '(empty)'}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">{p.category}</td>
                    <td className="p-2">{p.pointValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Logs */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Logs ({logs.length})</h2>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Product ID</th>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Points</th>
                  <th className="p-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="p-2">{log.id}</td>
                    <td className="p-2 font-mono text-xs">{log.productId.slice(0, 8)}</td>
                    <td className="p-2">
                      <span className={log.productName === '' || log.productName === 'Unknown' ? 'text-red-600 font-bold' : ''}>
                        {log.productName || '(EMPTY)'}
                      </span>
                    </td>
                    <td className="p-2">{log.category}</td>
                    <td className="p-2">{log.points}</td>
                    <td className="p-2 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
