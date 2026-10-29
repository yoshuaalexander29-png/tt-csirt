import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import { incidentReportingMiddleware } from './server/incidentReportingServer.js'

process.env.TTCSIRT_PUBLISHING_STORE_PATH ||= path.resolve(__dirname, 'server/data/published-advisories.json')

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function incidentReportingApiPlugin() {
  return {
    name: 'incident-reporting-api',
    configureServer(server: any) {
      server.middlewares.use(incidentReportingMiddleware);
    }
  }
}

function advisoriesApiPlugin() {
  return {
    name: 'advisories-api',
    async configureServer(server: any) {
      server.middlewares.use('/server/data', (_req: any, res: any) => {
        res.statusCode = 404;
        res.end('Not Found');
      });
      const { advisoriesRouter } = await import('./server/advisoriesRouter.js');
      server.middlewares.use('/api/advisories', (req: any, res: any, next: any) => {
        if (!res.status) {
          res.status = function (code: number) {
            this.statusCode = code;
            return this;
          };
        }
        if (!res.json) {
          res.json = function (data: any) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }
        advisoriesRouter(req, res, next);
      });
    }
  }
}

function publishingApiPlugin() {
  return {
    name: 'publishing-api',
    transformIndexHtml(html: string, ctx: any) {
      if (ctx.filename?.includes('apps/publishing') || ctx.path?.includes('publishing')) {
        return html.replace('./src/main.tsx', '/apps/publishing/src/main.tsx');
      }
      return html;
    },
    async configureServer(server: any) {
      if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH === undefined) {
        process.env.ENABLE_DEV_AUTH = 'true';
      }
      const { publishingRouter } = await import('./services/publishing-api/src/router.ts');
      const { isDevAuthEnabled } = await import('./services/publishing-api/src/auth/dev-auth-config.ts');

      // Wrap publishingRouter to provide Express response helper functions in Vite/Connect dev server
      server.middlewares.use('/api/publishing', async (req: any, res: any, next: any) => {
        if (!res.status) {
          res.status = function (code: number) {
            this.statusCode = code;
            return this;
          };
        }
        if (!res.json) {
          res.json = function (data: any) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }
        if (!res.send) {
          res.send = function (data: any) {
            if (typeof data === 'object') {
              return this.json(data);
            }
            this.end(data);
            return this;
          };
        }

        if (req.body === undefined && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          try {
            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw) {
              const contentType = req.headers['content-type'] || '';
              if (contentType.includes('application/json')) {
                try {
                  req.body = JSON.parse(raw);
                } catch {
                  res.status(400).json({
                    statusCode: 400,
                    error: 'BadRequest',
                    message: 'Malformed JSON request body.',
                  });
                  return;
                }
              } else {
                req.body = raw;
              }
            } else {
              req.body = {};
            }
          } catch {
            req.body = {};
          }
        }

        if (req.query === undefined && req.url) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            req.query = Object.fromEntries(parsedUrl.searchParams.entries());
          } catch {
            req.query = {};
          }
        }

        publishingRouter(req, res, next);
      });

      server.middlewares.use((req: any, res: any, next: any) => {
        // Mechanically block /publishing/dev-login if dev auth is disabled
        if (req.url === '/publishing/dev-login' || req.url.startsWith('/publishing/dev-login/')) {
          if (!isDevAuthEnabled()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not Found');
            return;
          }
        }

        if (req.url === '/publishing' || req.url.startsWith('/publishing/')) {
          req.url = '/apps/publishing/index.html';
        }
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    incidentReportingApiPlugin(),
    advisoriesApiPlugin(),
    publishingApiPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ttcsirt/canonical-types': path.resolve(__dirname, './packages/canonical-types/src'),
      '@ttcsirt/publishing-api': path.resolve(__dirname, './services/publishing-api/src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: [path.resolve(__dirname, 'node_modules')],
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true, // Allow all hosts for the proxy
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  }
})
