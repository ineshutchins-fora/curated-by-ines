import Anthropic from '@anthropic-ai/sdk';
import { CRUISE_PROMPT } from '@/lib/cruisePrompt';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destinations,
      departurePort,
      month,
      year,
      nights,
      guests,
      style,
      travelWith,
      priorities,
      firstCruise,
      email,
    } = body;

    if (!destinations?.length) {
      return new Response(JSON.stringify({ error: 'Please select at least one destination.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userMessage = `Please create a Curated by Ines cruise recommendation for:
- Destinations interested in: ${destinations?.join(', ') || 'flexible'}
- Preferred departure port: ${departurePort || 'flexible'}
- Travel timeframe: ${month || 'flexible'} ${year || ''}
- Trip length: ${nights || 'flexible'}
- Number of guests: ${guests || 'not specified'}
- Travel style/budget: ${style || 'mid-range'}
- Traveling with: ${travelWith || 'not specified'}
- What matters most: ${priorities?.join(', ') || 'balanced experience'}
- First cruise experience: ${firstCruise || 'not specified'}

Give me 2-3 specific cruise recommendations with ship names, itineraries, cabin suggestions, and insider tips in the Curated by Ines voice.`;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: CRUISE_PROMPT,
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
