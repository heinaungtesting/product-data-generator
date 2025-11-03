/**
 * Bundle API Route - Serves the product bundle
 * Alternative to GitHub Pages
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the bundle from public folder
    const bundlePath = path.join(process.cwd(), 'public', 'bundle.json.gz');

    if (!fs.existsSync(bundlePath)) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    const bundle = fs.readFileSync(bundlePath);

    return new NextResponse(bundle, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        // Don't set Content-Encoding - let client decompress
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'If-None-Match',
      },
    });
  } catch (error) {
    console.error('Error serving bundle:', error);
    return NextResponse.json(
      { error: 'Failed to serve bundle' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return GET();
}
