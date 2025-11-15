/**
 * Real-time Presence API - Vercel Edge Runtime
 *
 * Track who's online and what they're editing in real-time
 * Uses Supabase Realtime Presence for collaborative awareness
 *
 * Features:
 * - Track online users
 * - See who's editing which product
 * - Automatic cleanup on disconnect
 * - Presence heartbeat
 */

export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createEdgeClient } from '@/lib/supabase/client';

interface PresencePayload {
  userId: string;
  username: string;
  editingProductId?: string;
  action: 'join' | 'update' | 'leave';
}

/**
 * POST /api/realtime/presence
 * Update user presence state
 */
export async function POST(request: NextRequest) {
  try {
    const body: PresencePayload = await request.json();
    const { userId, username, editingProductId, action } = body;

    const supabase = createEdgeClient();

    const channel = supabase.channel('presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    if (action === 'join' || action === 'update') {
      await channel.track({
        userId,
        username,
        editingProductId,
        lastSeen: new Date().toISOString(),
      });
    } else if (action === 'leave') {
      await channel.untrack();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/realtime/presence
 * Get current presence state (who's online)
 */
export async function GET() {
  try {
    const supabase = createEdgeClient();

    const channel = supabase.channel('presence');

    // Subscribe briefly to get current state
    await new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve(null);
        }
      });
    });

    const presenceState = channel.presenceState();

    // Unsubscribe
    await channel.unsubscribe();

    // Transform presence state to array
    const users = Object.values(presenceState)
      .flat()
      .map((user: any) => ({
        userId: user.userId,
        username: user.username,
        editingProductId: user.editingProductId,
        lastSeen: user.lastSeen,
      }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get presence' },
      { status: 500 }
    );
  }
}
