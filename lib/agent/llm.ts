/**
 * Thin, dependency-free LLM layer.
 *
 * The planning pipeline is fully deterministic and works with no keys — the
 * model is used only to (a) improve natural-language understanding of messy
 * requests and (b) write warmer narrative copy. Every call degrades silently
 * to the rule-based path when a key is missing or the API errors.
 */

export const llmProvider = (): 'openai' | 'gemini' | null => {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return 'gemini';
  return null;
};

export const llmEnabled = () => llmProvider() !== null;

const TIMEOUT = 12_000;

async function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), TIMEOUT)),
  ]);
}

async function openaiChat(system: string, user: string, json: boolean): Promise<string | null> {
  const res = await withTimeout(
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.6,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    })
  );
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
}

async function geminiChat(system: string, user: string, json: boolean): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const res = await withTimeout(
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.6,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    })
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data: any = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

export async function llmText(system: string, user: string): Promise<string | null> {
  const provider = llmProvider();
  if (!provider) return null;
  try {
    return provider === 'openai' ? await openaiChat(system, user, false) : await geminiChat(system, user, false);
  } catch (err) {
    console.warn('[llm] text generation failed:', (err as Error).message);
    return null;
  }
}

export async function llmJson<T = unknown>(system: string, user: string): Promise<T | null> {
  const provider = llmProvider();
  if (!provider) return null;
  try {
    const raw = provider === 'openai' ? await openaiChat(system, user, true) : await geminiChat(system, user, true);
    if (!raw) return null;
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('[llm] json generation failed:', (err as Error).message);
    return null;
  }
}

export const AGENT_SYSTEM = `You are Wayfarer, a senior travel consultant for Indian travellers.
You are precise, warm and never invent facts. You always distinguish verified live data from
estimates and AI suggestions. You write short, concrete copy — no filler, no emoji, no hype.`;
