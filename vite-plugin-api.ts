import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Extract API route name
        const apiRoute = req.url.replace('/api/', '').split('?')[0];
        
        try {
          // Ensure environment variables are available
          if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
          }
          
          // Dynamically import the API handler
          const handler = await import(`./api/${apiRoute}.ts`);
          
          // Parse request body for POST requests
          let body = '';
          if (req.method === 'POST') {
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            await new Promise((resolve) => req.on('end', resolve));
          }

          // Create mock Vercel request/response objects
          const mockReq = {
            method: req.method,
            body: body ? JSON.parse(body) : {},
            headers: req.headers,
            query: {},
          };

          const mockRes = {
            status: (code: number) => ({
              json: (data: any) => {
                res.statusCode = code;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              }
            })
          };

          // Call the API handler
          await handler.default(mockReq, mockRes);
        } catch (error) {
          console.error(`API Error (${apiRoute}):`, error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
    }
  };
}
