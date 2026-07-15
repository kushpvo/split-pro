import { createNextApiHandler } from '@trpc/server/adapters/next';

import { env } from '~/env';
import { apiRouter } from '~/server/api/apiRouter';
import { createApiContext } from '~/server/api/apiContext';

/**
 * Public REST API handler (API-key auth), mounted at `/api/v1/*`, e.g.
 * `GET /api/v1/user.me`. Kept separate from the app's cookie-authed
 * `/api/trpc` handler so API keys can only reach the curated `apiRouter`.
 */
export default createNextApiHandler({
  router: apiRouter,
  createContext: createApiContext,
  onError:
    'development' === env.NODE_ENV
      ? ({ path, error }) => {
          console.error(`❌ API failed on ${path ?? '<no-path>'}: ${error.message}`);
        }
      : undefined,
});
