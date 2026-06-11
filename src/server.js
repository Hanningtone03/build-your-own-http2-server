const tls = require("tls");
const fs = require("fs");
const path = require("path");
const { HPack } = require("./hpack");
const { parseFrame, settingsFrame, headersFrame, dataFrame, windowUpdateFrame, FRAME_TYPES, FLAGS } = require("./frame");
const { StreamManager } = require("./stream");
const { getHandler } = require("./router");

const CLIENT_PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const PORT = 8443;

function handleConnection(socket) {
  const hpack = new HPack();
  const streams = new StreamManager();
  let prefaceReceived = false;
  let buffer = Buffer.alloc(0);

  console.log(`Client connected: ${socket.remoteAddress}`);

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    if (!prefaceReceived) {
      if (buffer.length < CLIENT_PREFACE.length) return;
      const preface = buffer.slice(0, CLIENT_PREFACE.length).toString();
      if (preface !== CLIENT_PREFACE) {
        socket.destroy();
        return;
      }
      prefaceReceived = true;
      buffer = buffer.slice(CLIENT_PREFACE.length);
      socket.write(settingsFrame());
      socket.write(windowUpdateFrame(0, 65535));
    }

    while (buffer.length >= 9) {
      const length = (buffer[0] << 16) | (buffer[1] << 8) | buffer[2];
      if (buffer.length < 9 + length) break;

      const frame = parseFrame(buffer);
      buffer = buffer.slice(9 + length);

      if (!frame) continue;

      if (frame.type === FRAME_TYPES.SETTINGS) {
        if (!(frame.flags & FLAGS.ACK)) {
          socket.write(settingsFrame(true));
        }
        continue;
      }

      if (frame.type === FRAME_TYPES.PING) {
        const pong = Buffer.alloc(17);
        pong[3] = 0x6;
        pong[4] = 0x1;
        frame.payload.copy(pong, 9);
        socket.write(pong);
        continue;
      }

      if (frame.type === FRAME_TYPES.HEADERS) {
        const stream = streams.get(frame.streamId);
        const headers = hpack.decode(frame.payload);
        stream.addHeaders(headers);

        if (frame.flags & FLAGS.END_STREAM || frame.flags & FLAGS.END_HEADERS) {
          const method = stream.headers[":method"] || "GET";
          const path = stream.headers[":path"] || "/";

          const handler = getHandler(method, path);
          const response = handler(stream.headers);

          const responseHeaders = {
            ":status": response.status,
            "content-type": response.headers["content-type"] || "text/plain",
            "content-length": String(Buffer.byteLength(response.body)),
            "server": "http2-from-scratch",
          };

          const headerBlock = hpack.encode(responseHeaders);
          socket.write(headersFrame(frame.streamId, headerBlock));
          socket.write(dataFrame(frame.streamId, Buffer.from(response.body)));
          streams.delete(frame.streamId);
        }
        continue;
      }

      if (frame.type === FRAME_TYPES.WINDOW_UPDATE) continue;
    }
  });

  socket.on("error", (err) => {
    console.log(`Socket error: ${err.message}`);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
}

function generateSelfSignedCert() {
  const certPath = path.join(__dirname, "../cert.pem");
  const keyPath = path.join(__dirname, "../key.pem");

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log("Generating self-signed certificate...");
    const { execSync } = require("child_process");
    try {
      execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`,
        { stdio: "pipe" }
      );
      console.log("Certificate generated.");
    } catch {
      console.log("OpenSSL not found. Using plain TCP instead.");
      return null;
    }
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    allowHTTP1: true,
  };
}

const tlsOptions = generateSelfSignedCert();

if (tlsOptions) {
  const server = tls.createServer(
    { ...tlsOptions, ALPNProtocols: ["h2"] },
    handleConnection
  );
  server.listen(PORT, () => {
    console.log(`HTTP/2 server listening on https://localhost:${PORT}`);
  });
} else {
  const net = require("net");
  const server = net.createServer(handleConnection);
  server.listen(PORT, () => {
    console.log(`HTTP/2 server listening on port ${PORT} (no TLS)`);
  });
}