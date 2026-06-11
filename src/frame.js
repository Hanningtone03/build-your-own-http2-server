const FRAME_TYPES = {
  DATA: 0x0,
  HEADERS: 0x1,
  SETTINGS: 0x4,
  PING: 0x6,
  GOAWAY: 0x7,
  WINDOW_UPDATE: 0x8,
};

const FLAGS = {
  END_STREAM: 0x1,
  END_HEADERS: 0x4,
  ACK: 0x1,
};

function buildFrame(type, flags, streamId, payload) {
  const frame = Buffer.alloc(9 + payload.length);
  frame.writeUInt32BE(payload.length << 8 | type, 0);
  frame[3] = type;
  frame[4] = flags;
  frame.writeUInt32BE(streamId & 0x7fffffff, 5);
  payload.copy(frame, 9);
  return frame;
}

function parseFrame(buf) {
  if (buf.length < 9) return null;
  const length = (buf[0] << 16) | (buf[1] << 8) | buf[2];
  const type = buf[3];
  const flags = buf[4];
  const streamId = buf.readUInt32BE(5) & 0x7fffffff;
  const payload = buf.slice(9, 9 + length);
  return { length, type, flags, streamId, payload };
}

function settingsFrame(ack = false) {
  return buildFrame(
    FRAME_TYPES.SETTINGS,
    ack ? FLAGS.ACK : 0,
    0,
    Buffer.alloc(0)
  );
}

function headersFrame(streamId, headerBlock, endStream = false) {
  const flags = FLAGS.END_HEADERS | (endStream ? FLAGS.END_STREAM : 0);
  return buildFrame(FRAME_TYPES.HEADERS, flags, streamId, headerBlock);
}

function dataFrame(streamId, data, endStream = true) {
  const flags = endStream ? FLAGS.END_STREAM : 0;
  return buildFrame(FRAME_TYPES.DATA, flags, streamId, data);
}

function windowUpdateFrame(streamId, increment) {
  const payload = Buffer.alloc(4);
  payload.writeUInt32BE(increment, 0);
  return buildFrame(FRAME_TYPES.WINDOW_UPDATE, 0, streamId, payload);
}

module.exports = {
  FRAME_TYPES,
  FLAGS,
  parseFrame,
  buildFrame,
  settingsFrame,
  headersFrame,
  dataFrame,
  windowUpdateFrame,
};