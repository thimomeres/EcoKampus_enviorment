import { defineConfig } from "vite";
import { debugProviders, fetchNewsFeed, startBackgroundRefresh } from "./server/newsHandler.ts";

function newsDevPlugin() {
  return {
    name: "ecokampus-news-api",
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (
            req: { method?: string; url?: string },
            res: {
              statusCode: number;
              setHeader: (name: string, value: string) => void;
              end: (body: string) => void;
            },
            next: (err?: unknown) => void,
          ) => void,
        ) => void;
      };
    }) {
      startBackgroundRefresh();
      server.middlewares.use(
        "/api/news",
        (
          req: { method?: string; url?: string },
          res: {
            statusCode: number;
            setHeader: (name: string, value: string) => void;
            end: (body: string) => void;
          },
          next: (err?: unknown) => void,
        ) => {
          void (async () => {
            if (req.method && req.method !== "GET") {
              res.statusCode = 405;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ error: "Metode tidak diizinkan" }));
              return;
            }
            try {
              const payload = req.url?.includes("debug=1")
                ? await debugProviders()
                : await fetchNewsFeed();
              res.setHeader("Cache-Control", "no-cache");
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify(payload));
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ error: "Gagal memuat berita" }));
            }
          })().catch(next);
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [newsDevPlugin()],
});
