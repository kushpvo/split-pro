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

const isPlainValue = (v: string): string | number | boolean => {
  if ('true' === v) {
    return true;
  }
  if ('false' === v) {
    return false;
  }
  const n = Number(v);
  if (!Number.isNaN(n) && String(n) === v) {
    return n;
  }

  return v;
};

/**
 * Public REST API handler (API-key auth), mounted at `/api/v1/*`, e.g.
 * `GET /api/v1/user.me`. The wrapper:
 *
 * 1. Converts individual query params (`?groupId=150`) into tRPC's
 *    `?input={"groupId":150}` format, coercing values to numbers/booleans
 *    where obvious.
 * 2. Wraps plain-JSON `?input=` payloads as superjson format ({json: …}) so
 *    the server transformer (superjson) can deserialise them correctly.
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if ('GET' === req.method && req.url) {
    const url = new URL(req.url, 'http://localhost');
    const rawInput = url.searchParams.get('input');

    if (rawInput) {
      /* — `?input=<JSON>` — wrap in superjson format if needed */
      try {
        const parsed = JSON.parse(rawInput);

        if (!('json' in parsed)) {
          url.searchParams.set('input', JSON.stringify({ json: parsed }));
          req.url = url.pathname + url.search;
        }
      } catch {
        /* Leave malformed input alone — tRPC will surface the parse error */
      }
    } else {
      /* — individual query params — build an `input` JSON object */
      const params: Record<string, unknown> = {};

      url.searchParams.forEach((value, key) => {
        if ('batch' !== key && 'trpc' !== key) {
          params[key] = isPlainValue(value);
        }
      });

      if (0 < Object.keys(params).length) {
        url.searchParams.set('input', JSON.stringify({ json: params }));
        req.url = url.pathname + url.search;
      }
    }
  }

  await handler(req, res);
};
