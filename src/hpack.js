const STATIC_TABLE = [
  null,
  [":authority", ""],
  [":method", "GET"],
  [":method", "POST"],
  [":path", "/"],
  [":path", "/index.html"],
  [":scheme", "http"],
  [":scheme", "https"],
  [":status", "200"],
  [":status", "204"],
  [":status", "206"],
  [":status", "304"],
  [":status", "400"],
  [":status", "404"],
  [":status", "500"],
  ["accept-charset", ""],
  ["accept-encoding", "gzip, deflate"],
  ["accept-language", ""],
  ["accept-ranges", ""],
  ["accept", ""],
  ["access-control-allow-origin", ""],
  ["age", ""],
  ["allow", ""],
  ["authorization", ""],
  ["cache-control", ""],
  ["content-disposition", ""],
  ["content-encoding", ""],
  ["content-language", ""],
  ["content-length", ""],
  ["content-location", ""],
  ["content-range", ""],
  ["content-type", ""],
  ["cookie", ""],
  ["date", ""],
  ["etag", ""],
  ["expect", ""],
  ["expires", ""],
  ["from", ""],
  ["host", ""],
  ["if-match", ""],
  ["if-modified-since", ""],
  ["if-none-match", ""],
  ["if-range", ""],
  ["if-unmodified-since", ""],
  ["last-modified", ""],
  ["link", ""],
  ["location", ""],
  ["max-forwards", ""],
  ["proxy-authenticate", ""],
  ["proxy-authorization", ""],
  ["range", ""],
  ["referer", ""],
  ["refresh", ""],
  ["retry-after", ""],
  ["server", ""],
  ["set-cookie", ""],
  ["strict-transport-security", ""],
  ["transfer-encoding", ""],
  ["user-agent", ""],
  ["vary", ""],
  ["via", ""],
  ["www-authenticate", ""],
];

class HPack {
  constructor() {
    this.dynamicTable = [];
    this.maxTableSize = 4096;
  }

  encode(headers) {
    const parts = [];
    for (const [name, value] of Object.entries(headers)) {
      const idx = STATIC_TABLE.findIndex(
        (e) => e && e[0] === name && e[1] === value
      );
      if (idx > 0) {
        parts.push(Buffer.from([0x80 | idx]));
      } else {
        const nameIdx = STATIC_TABLE.findIndex((e) => e && e[0] === name);
        if (nameIdx > 0) {
          parts.push(Buffer.from([0x40 | nameIdx]));
        } else {
          parts.push(Buffer.from([0x40, name.length, ...Buffer.from(name)]));
        }
        parts.push(Buffer.from([value.length, ...Buffer.from(value)]));
      }
    }
    return Buffer.concat(parts);
  }

  decode(buf) {
    const headers = {};
    let i = 0;
    while (i < buf.length) {
      if (buf[i] & 0x80) {
        const idx = buf[i] & 0x7f;
        if (STATIC_TABLE[idx]) {
          headers[STATIC_TABLE[idx][0]] = STATIC_TABLE[idx][1];
        }
        i++;
      } else {
        i++;
        if (i >= buf.length) break;
        const nameLen = buf[i++];
        const name = buf.slice(i, i + nameLen).toString();
        i += nameLen;
        const valueLen = buf[i++];
        const value = buf.slice(i, i + valueLen).toString();
        i += valueLen;
        headers[name] = value;
      }
    }
    return headers;
  }
}

module.exports = { HPack };