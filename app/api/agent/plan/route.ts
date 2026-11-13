import { planTrip, type AgentEvent } from '@/lib/agent/orchestrator';
import type { TravelBrief } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Streams agent progress as newline-delimited JSON so the UI can render each
 * specialist agent's status live instead of waiting for the whole plan.
 */
export async function POST(req: Request) {
  let body: { text?: string; defaults?: Partial<TravelBrief> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  const text = (body.text ?? '').trim();
  if (!text) return new Response(JSON.stringify({ error: 'Tell me where you want to go.' }), { status: 400 });
  if (text.length > 1500) return new Response(JSON.stringify({ error: 'That message is too long.' }), { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
        } catch {
          /* client disconnected */
        }
      };
      try {
        await planTrip({ text, defaults: body.defaults }, send);
      } catch (err) {
        console.error('[agent] plan failed', err);
        send({ type: 'error', message: 'I hit a problem building that plan. Try rephrasing, or narrow the request.' });
        send({ type: 'done' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
