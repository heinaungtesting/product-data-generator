/**
 * Logs API Route - Stores product viewing logs
 * Saves to Google Sheets for backup and analysis
 */

import { NextResponse } from 'next/server';
import { appendLogToSheet, isGoogleSheetsEnabled } from '@/lib/sheets';

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

    // Prepare log entry
    const logEntry = {
      productId: body.productId,
      productName: body.productName || 'Unknown Product',
      category: body.category || 'unknown',
      timestamp: body.timestamp,
      points: body.points || 0,
    };

    console.log('Log received:', logEntry);

    // Save to Google Sheets if enabled
    if (isGoogleSheetsEnabled()) {
      const result = await appendLogToSheet(logEntry);

      if (!result.success) {
        console.error('Google Sheets save failed:', result.error);
        // Don't fail the request - log locally succeeded
        return NextResponse.json(
          {
            ok: true,
            warning: 'Saved locally, but Google Sheets sync failed',
            sheetsError: result.error
          },
          { status: 200 }
        );
      }

      console.log('Log saved to Google Sheets successfully');
    } else {
      console.log('Google Sheets integration disabled - log saved locally only');
    }

    return NextResponse.json({ ok: true, savedToSheets: isGoogleSheetsEnabled() }, { status: 200 });
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json(
      { error: 'Failed to save log' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return Google Sheets status
  return NextResponse.json({
    googleSheetsEnabled: isGoogleSheetsEnabled(),
    message: 'Logs are stored in IndexedDB locally and optionally synced to Google Sheets'
  });
}
