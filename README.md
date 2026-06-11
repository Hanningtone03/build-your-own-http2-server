# Build Your Own HTTP/2 Server

An HTTP/2 server built from scratch in Node.js; implements the full HTTP/2 framing layer, HPACK header compression, stream multiplexing and TLS negotiation.

## How it works

HTTP/2 is a binary protocol that runs over TLS. Unlike HTTP/1.1 which sends plain text, HTTP/2 breaks communication into frames and multiplexes multiple requests over a single connection. This project implements that from scratch:

- Performs TLS handshake with ALPN protocol negotiation
- Validates the HTTP/2 client connection preface
- Parses and builds binary HTTP/2 frames
- Manages multiple concurrent streams over one connection
- Compresses and decompresses headers using HPACK with the static table
- Routes requests and sends framed responses

Built on top of the concepts from [build-your-own-http-server](https://github.com/Hanningtone03/build-your-own-http-server) — start there to understand the HTTP/1.1 foundation.

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

Test the connection:

```bash
node -e "const tls=require('tls');const s=tls.connect(8443,'localhost',{rejectUnauthorized:false,ALPNProtocols:['h2']},()=>{console.log('Connected:',s.alpnProtocol);s.destroy()});s.on('error',e=>console.log('Error:',e.message))"
```

## Routes

| Method | Path | Response |
|--------|------|----------|
| GET | `/` | Welcome message |
| GET | `/about` | About message |
| GET | `/json` | JSON response |
| ANY | `*` | 404 Not Found |

## Tech

- Node.js
- `tls` module (TLS/SSL)
- `net` module (TCP)
- No external dependencies
