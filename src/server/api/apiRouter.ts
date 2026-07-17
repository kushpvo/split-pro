import superjson from 'superjson';

import { createTRPCRouter } from '~/server/api/trpc';

import {
  addOrEditExpenseApiProcedure,
  getAllExpensesProcedure,
  getBalancesProcedure,
  getExpenseDetailsProcedure,
  getGroupExpensesProcedure,
} from './routers/expense';
import { getAllGroupsProcedure, getGroupDetailsProcedure } from './routers/group';
import { getFriendsProcedure, meProcedure } from './routers/user';

/**
 * Public REST API surface, served at `/api/v1` with API-key auth and documented
 * by the generated OpenAPI spec.
 *
 * This is intentionally a *curated subset* of `appRouter`: `@trpc/openapi` has
 * no per-procedure filter, so exposure is controlled structurally by only
 * mounting procedures here. Add new public endpoints one at a time.
 */
const _apiRouter = createTRPCRouter({
  user: createTRPCRouter({
    me: meProcedure,
    getFriends: getFriendsProcedure,
  }),
  group: createTRPCRouter({
    getAllGroups: getAllGroupsProcedure,
    getGroupDetails: getGroupDetailsProcedure,
  }),
  expense: createTRPCRouter({
    getAllExpenses: getAllExpensesProcedure,
    getBalances: getBalancesProcedure,
    getExpenseDetails: getExpenseDetailsProcedure,
    getGroupExpenses: getGroupExpensesProcedure,
    addOrEditExpense: addOrEditExpenseApiProcedure,
  }),
});

/**
 * API consumers send plain JSON. The server's tRPC instance uses superjson,
 * whose `deserialize` returns `undefined` for plain objects. We swap in a
 * forgiving deserializer that falls back to the raw value when superjson does
 * not recognise the payload. Output serialization stays unchanged.
 */
const originalDeserialize = (superjson.deserialize as unknown as (data: unknown) => unknown).bind(
  superjson,
);
_apiRouter._def._config.transformer = {
  input: {
    serialize: superjson.serialize.bind(superjson),
    deserialize: (data: unknown) => {
      if (null === data || undefined === data) {
        return data;
      }

      const deserialized = originalDeserialize(data);
      if (undefined === deserialized && 'object' === typeof data) {
        return data;
      }

      return deserialized;
    },
  },
  output: {
    serialize: superjson.serialize.bind(superjson),
    deserialize: originalDeserialize,
  },
};

export const apiRouter = _apiRouter;

export type ApiRouter = typeof apiRouter;
