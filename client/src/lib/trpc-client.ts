import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

/**
 * Cria um cliente tRPC com suporte a token JWT
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const token = localStorage.getItem("auth_token");
        return {
          authorization: token ? `Bearer ${token}` : "",
        };
      },
    }),
  ],
});
