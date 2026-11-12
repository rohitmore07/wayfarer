import { NextResponse } from 'next/server';
import { refinePlan } from '@/lib/agent/orchestrator';
import type { PlanPayload } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { plan, message } = (await req.json()) as { plan: PlanPayload; message: string };
    if (!plan || !message?.trim()) return NextResponse.json({ error: 'Missing plan or message' }, { status: 400 });
    const result = await refinePlan(plan, message.trim().slice(0, 600));
    return NextResponse.json(result);
  } catch (err) {
    console.error('[agent] refine failed', err);
    return NextResponse.json({ error: 'Could not update the plan. Try again.' }, { status: 500 });
  }
}
