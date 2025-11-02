/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Bundle Builder - Reads NDJSON data and creates gzipped bundle
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import pako from 'pako';
import { Octokit } from '@octokit/rest';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_DIR = path.join(process.cwd(), 'dist');

/**
 * Read and parse NDJSON products file
 */
async function readProducts() {
  const productsPath = path.join(DATA_DIR, 'products.ndjson');

  try {
    const content = await fs.readFile(productsPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error(`Failed to parse line: ${line.substring(0, 50)}...`);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to read products:', error);
    return [];
  }
}

/**
 * Build bundle JSON
 */
export async function buildBundle({ schemaVersion, compress = true }) {
  const products = await readProducts();

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

/**
 * Publish bundle to GitHub Pages
 */
export async function publishToGitHub(bundle) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable not set');
  }

  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY environment variable not set');
  }

  const octokit = new Octokit({ auth: token });

  // Read bundle file
  const bundleContent = await fs.readFile(bundle.outputPath);
  const etagContent = await fs.readFile(path.join(OUTPUT_DIR, 'etag.txt'), 'utf-8');

  // Get or create gh-pages branch
  try {
    await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/gh-pages',
    });
  } catch (error) {
    // Create gh-pages branch if it doesn't exist
    const mainRef = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: 'refs/heads/gh-pages',
      sha: mainRef.data.object.sha,
    });
  }

  // Helper to fetch existing file SHA (if present)
  const getFileSha = async (filePath) => {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: 'gh-pages',
      });

      if (Array.isArray(data)) {
        return null;
      }

      return data.sha ?? null;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  };

  // Upload files to gh-pages
  const bundlePath = 'bundle.json.gz';
  const etagPath = 'etag.txt';

  const updateFile = async (filePath, content, message) => {
    const existingSha = await getFileSha(filePath);
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content,
      branch: 'gh-pages',
      ...(existingSha ? { sha: existingSha } : {}),
    });
  };

  await updateFile(
    bundlePath,
    bundleContent.toString('base64'),
    `Update bundle: ${bundle.etag.substring(0, 8)}`
  );

  await updateFile(
    etagPath,
    Buffer.from(etagContent).toString('base64'),
    `Update etag: ${bundle.etag.substring(0, 8)}`
  );

  const url = `https://${owner}.github.io/${repo}/${bundlePath}`;

  console.error(`✓ Published to GitHub Pages: ${url}`);

  return {
    url,
    etag: bundle.etag,
  };
}
