import { createNextApiHandler } from '@trpc/server/adapters/next';
import type { NextApiRequest, NextApiResponse } from 'next';

import { env } from '~/env';
import { apiRouter } from '~/server/api/apiRouter';
import { createApiContext } from '~/server/api/apiContext';

const handler = createNextApiHandler({
  router: apiRouter,
  createContext: createApiContext,
  onError:
    'development' === env.NODE_ENV
      ? ({ path, error }) => {
          console.error(`❌ API failed on ${path ?? '<no-path>'}: ${error.message}`);
        }
      : undefined,
});

/**
 * Public REST API handler (API-key auth), mounted at `/api/v1/*`, e.g.
 * `GET /api/v1/user.me`. Kept separate from the app's cookie-authed
 * `/api/trpc` handler so API keys can only reach the curated `apiRouter`.
 *
 * The wrapper re-encodes plain-JSON `?input=` payloads as superjson format
 * ({json: …}) so the server transformer can deserialise them correctly.
 * API consumers send regular JSON; the wrapper bridges the two worlds.
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if ('GET' === req.method && req.url) {
    const url = new URL(req.url, 'http://localhost');
    const rawInput = url.searchParams.get('input');

    if (rawInput) {
      try {
        const parsed = JSON.parse(rawInput);

        if (!('json' in parsed)) {
          url.searchParams.set('input', JSON.stringify({ json: parsed }));
          req.url = url.pathname + url.search;
        }
      } catch {
        /* Leave malformed input alone — tRPC will surface the parse error */
      }
    }
  }

  await handler(req, res);
};
