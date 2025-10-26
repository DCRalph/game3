import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

import { Server } from "socket.io";

const port = parseInt(process.env.PORT ?? '3000', 10)
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev, turbo: true })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl).catch(console.error)
  })

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("test", () => {
      console.log("test event received");
      socket.emit("message", "Hello from server");
    });
  });

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