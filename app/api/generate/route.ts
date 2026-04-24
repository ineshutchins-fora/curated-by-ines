import Anthropic from '@anthropic-ai/sdk';
import { MASTER_PROMPT } from '@/lib/prompt';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, duration, month, budget, styles, pace, who } = body;

    if (!destination || !duration) {
      return new Response(JSON.stringify({ error: 'Destination and trip length are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userMessage = `Please create a full Curated by Ines travel plan for:
- Destination: ${destination}
- Trip length: ${duration}
- Month: ${month || 'flexible / not specified'}
- Budget level: ${budget || 'mid-range'}
- Travel style: ${styles?.length ? styles.join(', ') : 'balanced mix'}
- Travel pace: ${pace || 'balanced'}
- Traveling with: ${who || 'not specified'}`;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: MASTER_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
