/**
 * Bundle Builder - Reads from SQLite database directly and creates gzipped bundle
 * Uses better-sqlite3 instead of Prisma to avoid engine download issues
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import pako from 'pako';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
const OUTPUT_DIR = path.join(process.cwd(), '..', 'dist');
const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), '..', 'prisma', 'dev.db');

/**
 * Read products from SQLite database
 * Returns products in NDJSON-compatible format for MyApp
 */
function readProducts() {
  try {
    const db = Database(DB_PATH, { readonly: true });

    // Get all products
    const products = db.prepare(`
      SELECT id, category, pointValue, createdAt, updatedAt
      FROM Product
      ORDER BY createdAt DESC
    `).all();

    // Get all texts
    const textsStmt = db.prepare(`
      SELECT productId, language, name, description, effects, sideEffects, goodFor
      FROM ProductText
      WHERE productId = ?
    `);

    // Get all tags for a product
    const tagsStmt = db.prepare(`
      SELECT t.name
      FROM ProductTag pt
      JOIN Tag t ON pt.tagId = t.id
      WHERE pt.productId = ?
    `);

    // Transform to NDJSON-compatible format
    const result = products.map(product => {
      // Get texts for this product
      const textsArray = textsStmt.all(product.id);

      // Get tags for this product
      const tagsArray = tagsStmt.all(product.id);

      return {
        id: product.id,
        category: product.category,
        pointValue: product.pointValue,
        texts: textsArray.map(text => ({
          language: text.language,
          name: text.name,
          description: text.description,
          effects: text.effects,
          sideEffects: text.sideEffects,
          goodFor: text.goodFor
        })),
        tags: tagsArray.map(t => t.name),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    db.close();
    return result;

  } catch (error) {
    console.error('Failed to read products from database:', error);
    return [];
  }
}

/**
 * Build bundle JSON
 */
export async function buildBundle({ schemaVersion = '1.0', compress = true }) {
  const products = readProducts();

  const bundle = {
    schemaVersion,
    builtAt: new Date().toISOString(),
    productCount: products.length,
    products,
    purchaseLog: [],
  };

  const json = JSON.stringify(bundle);
  const jsonBuffer = Buffer.from(json, 'utf-8');

  let output = jsonBuffer;
  let outputPath = path.join(OUTPUT_DIR, 'bundle.json');

  if (compress) {
    output = pako.gzip(jsonBuffer);
    outputPath = path.join(OUTPUT_DIR, 'bundle.json.gz');
  }

  // Calculate ETag
  const etag = crypto.createHash('sha256').update(output).digest('hex');

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Write bundle
  await fs.writeFile(outputPath, output);

  // Write ETag
  await fs.writeFile(path.join(OUTPUT_DIR, 'etag.txt'), etag);

  // Update metadata
  const meta = {
    lastBuild: new Date().toISOString(),
    etag,
    productCount: products.length,
    schemaVersion,
    sizeBytes: output.length,
  };

  await fs.writeFile(
    path.join(DATA_DIR, 'meta.json'),
    JSON.stringify(meta, null, 2)
  );

  console.error(`✓ Bundle built: ${products.length} products, ${output.length} bytes`);

  return {
    etag,
    productCount: products.length,
    sizeBytes: output.length,
    outputPath,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  buildBundle({ schemaVersion: '1.0', compress: true })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}
