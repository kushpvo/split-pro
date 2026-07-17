import { createTRPCRouter } from '~/server/api/trpc';

import { getAllGroupsProcedure } from './routers/group';
import { getFriendsProcedure, meProcedure } from './routers/user';

/**
 * Public REST API surface, served at `/api/v1` with API-key auth and documented
 * by the generated OpenAPI spec.
 *
 * This is intentionally a *curated subset* of `appRouter`: `@trpc/openapi` has
 * no per-procedure filter, so exposure is controlled structurally by only
 * mounting procedures here. Add new public endpoints one at a time.
 */
export const apiRouter = createTRPCRouter({
  user: createTRPCRouter({
    me: meProcedure,
    getFriends: getFriendsProcedure,
  }),
  group: createTRPCRouter({
    getAllGroups: getAllGroupsProcedure,
  }),
});

export type ApiRouter = typeof apiRouter;
