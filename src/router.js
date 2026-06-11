const routes = {};

function addRoute(method, path, handler) {
  const key = `${method.toUpperCase()}:${path}`;
  routes[key] = handler;
}

function getHandler(method, path) {
  const key = `${method.toUpperCase()}:${path}`;
  if (routes[key]) return routes[key];
  return () => ({
    status: "404",
    headers: { "content-type": "text/plain" },
    body: "Not Found",
  });
}

addRoute("GET", "/", () => ({
  status: "200",
  headers: { "content-type": "text/plain" },
  body: "Welcome to HTTP/2 server",
}));

addRoute("GET", "/about", () => ({
  status: "200",
  headers: { "content-type": "text/plain" },
  body: "HTTP/2 server built from scratch in Node.js",
}));

addRoute("GET", "/json", () => ({
  status: "200",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ server: "http2", version: "1.0", built: "from scratch" }),
}));

module.exports = { addRoute, getHandler };