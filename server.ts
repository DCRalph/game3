import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import nextConfig from './next.config'

import { createSocketServer } from './src/server/socketServer'

const port = parseInt(process.env.PORT ?? '3000', 10)
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev, turbo: true, conf: nextConfig })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl).catch(console.error)
  })

  // if (!dev)
    createSocketServer(httpServer);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(
        `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
        }`
      )
    });

}).catch(console.error)