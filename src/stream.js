class Stream {
  constructor(id) {
    this.id = id;
    this.state = "open";
    this.headers = {};
    this.data = [];
  }

  addHeaders(headers) {
    this.headers = { ...this.headers, ...headers };
  }

  addData(chunk) {
    this.data.push(chunk);
  }

  getBody() {
    return Buffer.concat(this.data).toString();
  }

  close() {
    this.state = "closed";
  }
}

class StreamManager {
  constructor() {
    this.streams = new Map();
  }

  get(id) {
    if (!this.streams.has(id)) {
      this.streams.set(id, new Stream(id));
    }
    return this.streams.get(id);
  }

  delete(id) {
    this.streams.delete(id);
  }

  getAll() {
    return this.streams;
  }
}

module.exports = { Stream, StreamManager };