#!/usr/bin/env node

/**
 * Marky - local static web server
 *
 * Serves the Marky markdown editor from the package directory on
 * http://localhost:3456 (loopback only, plain HTTP, no HTTPS).
 *
 * Dependency-free: uses only Node core modules (node:http, node:fs, node:path).
 *
 * Usage:
 *   node server.js
 *   npm run serve
 *   npx marky-md-to-docx
 *
 * On Ctrl+C the server shuts down cleanly (exit code 0, no output).
 * If port 3456 is already taken, the existing server is probed with an
 * HTTP GET: a Marky page leads to a friendly "already running" message,
 * anything else to a clear port-busy message.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = 3456;
const APP_URL = `http://localhost:${PORT}`;

// Package directory containing index.html, app.js, renderers.js, etc.
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

// Markers used to recognize a Marky page (see index.html).
const MARKY_MARKERS = [
  /<title>\s*Marky/i,
  /name=["']application-name["']\s+content=["']Marky/i,
  /name=["']author["']\s+content=["']Marky/i,
  /<h1[^>]*>\s*Marky/i,
];

function looksLikeMarky(body) {
  return MARKY_MARKERS.some((marker) => marker.test(body));
}

/**
 * Probe whatever is listening on PORT with an HTTP GET and return its body
 * ("" on any failure).
 */
function probePort() {
  return new Promise((resolve) => {
    const request = http.get({ host: HOST, port: PORT, path: "/", timeout: 2000 }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(body));
      response.on("error", () => resolve(""));
    });
    request.on("timeout", () => {
      request.destroy();
      resolve("");
    });
    request.on("error", () => resolve(""));
  });
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body ?? "", "utf8");
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": buffer.length,
  });
  res.end(buffer);
}

const server = http.createServer((req, res) => {
  const method = (req.method || "GET").toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  // Strip the query string and decode the path.
  let requestPath;
  try {
    requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  } catch {
    send(res, 400, "Bad Request: invalid URL encoding");
    return;
  }

  // Resolve against the package directory, guarding against path traversal.
  let filePath = path.normalize(path.join(ROOT, requestPath));
  if (filePath === ROOT) {
    filePath = path.join(ROOT, "index.html");
  } else {
    const relative = path.relative(ROOT, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      send(res, 403, "Forbidden");
      return;
    }
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      const status = statError.code === "ENOENT" ? 404 : 403;
      send(res, status, status === 404 ? "Not Found" : "Forbidden");
      return;
    }
    // Directory requests serve the index.html inside that directory.
    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        const status = readError.code === "ENOENT" ? 404 : 403;
        send(res, status, status === 404 ? "Not Found" : "Forbidden");
        return;
      }
      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Content-Length": data.length });
      if (method === "HEAD") res.end();
      else res.end(data);
    });
  });
});

server.on("error", async (error) => {
  if (error.code === "EADDRINUSE") {
    const body = await probePort();
    if (looksLikeMarky(body)) {
      console.log(`Marky is already running at ${APP_URL}`);
      process.exit(0);
    }
    console.error(`Port ${PORT} is already in use by another process.`);
    console.error(body === "" ? "The server on that port did not respond." : "The server on that port is not Marky.");
    console.error("Stop that process or use a different port, then try again.");
    process.exit(1);
  }
  console.error(`Failed to start server on port ${PORT}: ${error.message}`);
  process.exit(1);
});

// Shut down cleanly: exit code 0, no output.
function shutdown() {
  server.close(() => process.exit(0));
  // Force-exit shortly after so lingering keep-alive connections can't block shutdown.
  setTimeout(() => process.exit(0), 500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PORT, HOST, () => {
  console.log(`Marky is running at ${APP_URL}`);
  console.log("Press Ctrl+C to stop.");
});
