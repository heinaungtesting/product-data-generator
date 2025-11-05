/**
 * Logs API Route - Stores product viewing logs
 */

import { NextResponse } from 'next/server';

interface IncomingLogBody {
  productId?: string;
  productName?: string;
  timestamp?: string;
  category?: string;
  points?: number;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingLogBody;

    // Validate log entry
    if (!body.productId || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, timestamp' },
        { status: 400 }
      );
    }

    // In a real app, you'd save to database here
    // For now, just return success
    console.log('Log saved:', body);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json(
      { error: 'Failed to save log' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Future: return logs
  return NextResponse.json({ logs: [] });
}
