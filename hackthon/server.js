/* =========================================================
   SkillBridge AI — zero-dependency Node server
   - Serves the static site
   - Real signup / login / logout API
   - scrypt password hashing + signed HttpOnly session cookie
   - Local JSON user store (nothing leaves this machine)

   Run:  node server.js   (or: npm start)
   ========================================================= */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SECRET_FILE = path.join(DATA_DIR, ".session-secret");

const SESSION_COOKIE = "sb_session";
const REMEMBER_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_MS = 1000 * 60 * 60 * 12; // 12 hours when "remember me" is off
const MAX_BODY = 16 * 1024;
const RATE_WINDOW_MS = 1000 * 60 * 10;
const RATE_LIMIT = 20;

const DEMO_ACCOUNT = {
  name: "Sakura Demo",
  email: "demo@skillbridge.ai",
  password: "Sakura2026!"
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

/* ---------------------------------------------------------
   Small helpers
   --------------------------------------------------------- */
const now = () => Date.now();
const b64url = (buffer) => Buffer.from(buffer).toString("base64url");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function safeName(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function scryptHash(password, salt) {
  return crypto.scryptSync(password, salt, 64);
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    salt,
    passwordHash: scryptHash(password, salt).toString("hex")
  };
}

function verifyPassword(password, user) {
  try {
    const stored = Buffer.from(user.passwordHash, "hex");
    const candidate = scryptHash(password, user.salt);
    return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function isSecure(req) {
  return (req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}

/* ---------------------------------------------------------
   Persistent state
   --------------------------------------------------------- */
fs.mkdirSync(DATA_DIR, { recursive: true });

let sessionSecret;
if (fs.existsSync(SECRET_FILE)) {
  sessionSecret = fs.readFileSync(SECRET_FILE);
} else {
  sessionSecret = crypto.randomBytes(48);
  fs.writeFileSync(SECRET_FILE, sessionSecret, { mode: 0o600 });
}

let users = [];
try {
  const parsed = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  users = Array.isArray(parsed) ? parsed : [];
} catch {
  users = [];
}

function seedDemoAccount() {
  if (users.some((user) => normalizeEmail(user.email) === DEMO_ACCOUNT.email)) return;
  const record = createPasswordRecord(DEMO_ACCOUNT.password);
  users.push({
    id: `usr_${crypto.randomUUID()}`,
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    ...record,
    createdAt: new Date().toISOString(),
    demo: true
  });
}

seedDemoAccount();

let writeQueue = Promise.resolve();
function persistUsers() {
  const snapshot = JSON.stringify(users, null, 2);
  writeQueue = writeQueue
    .catch(() => {})
    .then(async () => {
      const temp = `${USERS_FILE}.${process.pid}.tmp`;
      await fsp.writeFile(temp, snapshot, { mode: 0o600 });
      await fsp.rename(temp, USERS_FILE);
    })
    .catch((error) => console.error("[users] Could not persist user store:", error.message));
  return writeQueue;
}
persistUsers();

/* ---------------------------------------------------------
   Sessions: stateless signed tokens (HMAC-SHA256)
   --------------------------------------------------------- */
function signSession(userId, ttl) {
  const payload = b64url(JSON.stringify({ sub: userId, iat: now(), exp: now() + ttl }));
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data.sub !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < now()) return null;
    return data;
  } catch {
    return null;
  }
}

function sessionCookie(req, token, remember) {
  const maxAge = remember ? REMEMBER_MS : SESSION_MS;
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(maxAge / 1000)}`
  ];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

function clearCookie(req) {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

/* ---------------------------------------------------------
   Very small in-memory rate limiter
   --------------------------------------------------------- */
const rateBuckets = new Map();

function rateLimit(req) {
  const key = `${req.socket.remoteAddress || "local"}`;
  const current = now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.reset <= current) {
    rateBuckets.set(key, { count: 1, reset: current + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT;
}

setInterval(() => {
  const current = now();
  for (const [key, bucket] of rateBuckets) {
    if (bucket.reset <= current) rateBuckets.delete(key);
  }
}, 60 * 1000).unref();

/* ---------------------------------------------------------
   HTTP helpers
   --------------------------------------------------------- */
function baseHeaders(extra) {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; "),
    ...extra
  };
}

function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(
    status,
    baseHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
      ...headers
    })
  );
  res.end(body);
}

function sendText(res, status, text, headers = {}) {
  res.writeHead(
    status,
    baseHeaders({
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": Buffer.byteLength(text),
      "Cache-Control": "no-store",
      ...headers
    })
  );
  res.end(text);
}

async function readJsonBody(req) {
  if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) {
    const error = new Error("Please send the form as JSON.");
    error.status = 415;
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON body.");
    error.status = 400;
    throw error;
  }
}

/* ---------------------------------------------------------
   API routes
   --------------------------------------------------------- */
async function handleApi(req, res, pathname) {
  if (pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, service: "skillbridge-auth", time: new Date().toISOString() });
  }

  if (pathname === "/api/me" && req.method === "GET") {
    const session = readSession(readCookie(req, SESSION_COOKIE));
    const user = session && users.find((entry) => entry.id === session.sub);
    if (!user) return sendJson(res, 200, { ok: true, user: null });
    return sendJson(res, 200, { ok: true, user: publicUser(user) });
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    return sendJson(res, 200, { ok: true, message: "Signed out." }, { "Set-Cookie": clearCookie(req) });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." });
  }

  if (pathname === "/api/signup") {
    if (!rateLimit(req)) {
      return sendJson(res, 429, {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many attempts. Take a breath, then try again in a few minutes."
      });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      return sendJson(res, error.status || 400, { ok: false, code: "BAD_REQUEST", message: error.message });
    }

    const name = safeName(body.name);
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 40) {
      return sendJson(res, 400, { ok: false, code: "NAME_INVALID", field: "name", message: "Please use a name between 2 and 40 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) {
      return sendJson(res, 400, { ok: false, code: "EMAIL_INVALID", field: "email", message: "That email address does not look quite right." });
    }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return sendJson(res, 400, {
        ok: false,
        code: "PASSWORD_WEAK",
        field: "password",
        message: "Use at least 8 characters, including a letter and a number."
      });
    }
    if (body.acceptTerms !== true) {
      return sendJson(res, 400, {
        ok: false,
        code: "TERMS_REQUIRED",
        field: "terms",
        message: "Please accept the demo terms to create an account."
      });
    }
    if (users.some((user) => normalizeEmail(user.email) === email)) {
      return sendJson(res, 409, {
        ok: false,
        code: "EMAIL_TAKEN",
        field: "email",
        message: "An account with this email already exists. Try signing in instead."
      });
    }

    const user = {
      id: `usr_${crypto.randomUUID()}`,
      name,
      email,
      ...createPasswordRecord(password),
      createdAt: new Date().toISOString()
    };
    users.push(user);
    await persistUsers();

    const remember = body.remember !== false;
    const token = signSession(user.id, remember ? REMEMBER_MS : SESSION_MS);
    return sendJson(
      res,
      201,
      { ok: true, user: publicUser(user), message: "Your account is ready." },
      { "Set-Cookie": sessionCookie(req, token, remember) }
    );
  }

  if (pathname === "/api/login") {
    if (!rateLimit(req)) {
      return sendJson(res, 429, {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many attempts. Take a breath, then try again in a few minutes."
      });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      return sendJson(res, error.status || 400, { ok: false, code: "BAD_REQUEST", message: error.message });
    }

    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const user = users.find((entry) => normalizeEmail(entry.email) === email);

    // Compare against a dummy record when the user is missing so timing stays similar.
    const valid = user ? verifyPassword(password, user) : verifyPassword(password, {
      salt: "00000000000000000000000000000000",
      passwordHash: "00".repeat(64)
    });

    if (!user || !valid) {
      return sendJson(res, 401, {
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect. Give it another try."
      });
    }

    const remember = body.remember === true;
    const token = signSession(user.id, remember ? REMEMBER_MS : SESSION_MS);
    return sendJson(
      res,
      200,
      { ok: true, user: publicUser(user), message: `Welcome back, ${user.name.split(" ")[0]}.` },
      { "Set-Cookie": sessionCookie(req, token, remember) }
    );
  }

  return sendJson(res, 404, { ok: false, code: "NOT_FOUND", message: "API route not found." });
}

/* ---------------------------------------------------------
   Static files
   --------------------------------------------------------- */
function resolveStatic(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const resolved = path.resolve(ROOT, `.${decoded}`);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;

  const relative = path.relative(ROOT, resolved);
  const first = relative.split(path.sep)[0];
  if (relative && (first === "data" || first.startsWith(".") || first === "node_modules")) return null;

  return resolved;
}

async function handleStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendText(res, 405, "Method not allowed.");
  }

  if (pathname === "/login") {
    res.writeHead(302, baseHeaders({ Location: "/auth.html?mode=login" }));
    return res.end();
  }
  if (pathname === "/signup") {
    res.writeHead(302, baseHeaders({ Location: "/auth.html?mode=signup" }));
    return res.end();
  }
  if (pathname === "/auth") {
    res.writeHead(302, baseHeaders({ Location: "/auth.html" }));
    return res.end();
  }

  const isDirectoryRoute = pathname === "/";
  const targetPath = resolveStatic(isDirectoryRoute ? "/index.html" : pathname);
  if (!targetPath) return sendText(res, 400, "Bad request.");

  let filePath = targetPath;
  try {
    let stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      stat = await fsp.stat(filePath);
    }
    if (!stat.isFile()) throw new Error("Not a file");
  } catch {
    return sendText(res, 404, "Not found.");
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME[extension] || "application/octet-stream";
  const isAsset = /\.(css|js|svg|png|jpe?g|webp|gif|ico|woff2?|map)$/i.test(filePath);

  try {
    const data = await fsp.readFile(filePath);
    res.writeHead(
      200,
      baseHeaders({
        "Content-Type": contentType,
        "Content-Length": data.length,
        "Cache-Control": isAsset ? "public, max-age=300" : "no-cache"
      })
    );
    if (req.method === "HEAD") return res.end();
    res.end(data);
  } catch {
    sendText(res, 500, "Could not read that file.");
  }
}

/* ---------------------------------------------------------
   Server
   --------------------------------------------------------- */
const server = http.createServer(async (req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
  } catch {
    return sendText(res, 400, "Bad request.");
  }

  try {
    if (pathname.startsWith("/api/")) {
      return await handleApi(req, res, pathname);
    }
    return await handleStatic(req, res, pathname);
  } catch (error) {
    console.error(`[error] ${req.method} ${pathname}`, error);
    if (pathname.startsWith("/api/")) {
      return sendJson(res, 500, { ok: false, code: "SERVER_ERROR", message: "Something went wrong on the server." });
    }
    return sendText(res, 500, "Something went wrong.");
  }
});

server.listen(PORT, HOST, () => {
  const shownHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log("");
  console.log("  \x1b[38;5;219mSkillBridge AI\x1b[0m — sakura auth server");
  console.log(`  Site:   http://${shownHost}:${PORT}/`);
  console.log(`  Sign in: http://${shownHost}:${PORT}/auth.html`);
  console.log(`  Demo:   ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
  console.log(`  Users:  ${USERS_FILE}`);
  console.log("");
});

function shutdown() {
  console.log("\nShutting down…");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
