/**
 * Server-Sent Events (SSE) Stream - Real-time Notifications
 *
 * Provides a persistent HTTP connection for real-time updates
 * Uses SSE for unidirectional server→client push notifications
 *
 * Features:
 * - Real-time product changes
 * - Bundle regeneration notifications
 * - Presence updates
 * - Automatic reconnection
 * - Heartbeat keep-alive
 */

export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { createEdgeClient } from '@/lib/supabase/client';

/**
 * GET /api/realtime/stream
 * Opens SSE connection for real-time updates
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Initialize Supabase client
  const supabase = createEdgeClient();

  // Send SSE message helper
  const sendEvent = async (event: string, data: any) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Send heartbeat to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    try {
      await sendEvent('heartbeat', { timestamp: new Date().toISOString() });
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Every 30 seconds

  // Subscribe to product changes
  const productsChannel = supabase
    .channel('products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
      },
      async (payload) => {
        await sendEvent('product-change', {
          type: payload.eventType,
          product: payload.new,
          old: payload.old,
          timestamp: new Date().toISOString(),
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_texts',
      },
      async (payload) => {
        await sendEvent('product-text-change', {
          type: payload.eventType,
          productId: payload.new.product_id || payload.old.product_id,
          timestamp: new Date().toISOString(),
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bundle_metadata',
      },
      async (payload) => {
        await sendEvent('bundle-updated', {
          etag: payload.new.etag,
          productCount: payload.new.product_count,
          timestamp: payload.new.built_at,
        });
      }
    )
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await sendEvent('connected', {
          message: 'Real-time connection established',
          timestamp: new Date().toISOString(),
        });
      }
    });

  // Cleanup on connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    productsChannel.unsubscribe();
    writer.close();
  });

  // Send initial connection message
  await sendEvent('init', {
    message: 'SSE connection initialized',
    timestamp: new Date().toISOString(),
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
