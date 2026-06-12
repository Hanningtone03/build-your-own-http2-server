![CI](https://github.com/Hanningtone03/build-your-own-http2-server/actions/workflows/ci.yml/badge.svg)

# Build Your Own HTTP/2 Server

An HTTP/2 server in Node.js; binary framing, HPACK header compression, stream multiplexing, TLS.

## How it works

HTTP/2 is a binary protocol over TLS. A TLS handshake negotiates the `h2` protocol via ALPN. The server validates the client preface, then reads binary frames — HEADERS frames carry compressed headers, DATA frames carry the body. Multiple streams share one connection.

Built on top of the concepts from [build-your-own-http-server](https://github.com/Hanningtone03/build-your-own-http-server); start there for the HTTP/1.1 foundation.

## Project structure

```
src/
├── server.js
├── frame.js
├── hpack.js
├── stream.js
└── router.js
```

## Running locally

```bash
node src/server.js
```

```bash
node -e "const tls=require('tls');const s=tls.connect(8443,'localhost',{rejectUnauthorized:false,ALPNProtocols:['h2']},()=>{console.log('Connected:',s.alpnProtocol);s.destroy()});s.on('error',e=>console.log('Error:',e.message))"
```

## Tech

- Node.js
- `tls`, `net` modules
- No external dependencies
