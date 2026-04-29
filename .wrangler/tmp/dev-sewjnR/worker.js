var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-0cUQcA/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/worker.js
var COOKIE_NAME = "wtpw_session";
var COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
var DEFAULT_APP_BASE = "https://who-to-play-with.ljding94.workers.dev";
var router = {
  handlers: {},
  add(method, path, handler) {
    const key = `${method} ${path}`;
    this.handlers[key] = handler;
  },
  async dispatch(req, env) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;
    for (const [key, handler] of Object.entries(this.handlers)) {
      const [m, p] = key.split(" ");
      if (m !== method) continue;
      const paramNames = [];
      const regexStr = p.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      });
      const regex = new RegExp(`^${regexStr}$`);
      const match = path.match(regex);
      if (match) {
        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return handler(req, env, params, url);
      }
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json, "json");
function success(data = {}) {
  return json({ success: true, ...data });
}
__name(success, "success");
async function getJwtSecret(env) {
  return env.JWT_SECRET || "dev-secret-change-in-production";
}
__name(getJwtSecret, "getJwtSecret");
async function signJwt(payload, env) {
  const secret = await getJwtSecret(env);
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + COOKIE_MAX_AGE * 1e3 }));
  const signature = await hmacSha256(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, env) {
  try {
    const [header, body, signature] = token.split(".");
    const secret = await getJwtSecret(env);
    const expectedSig = await hmacSha256(`${header}.${body}`, secret);
    if (signature !== expectedSig) return null;
    return JSON.parse(atob(body));
  } catch {
    return null;
  }
}
__name(verifyJwt, "verifyJwt");
async function hmacSha256(message, key) {
  const enc = new TextEncoder();
  const k = enc.encode(key);
  const msg = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", cryptoKey, msg);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
__name(hmacSha256, "hmacSha256");
function parseCookies(cookieHeader2 = "") {
  const map = {};
  for (const pair of cookieHeader2.split(";")) {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      map[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
  return map;
}
__name(parseCookies, "parseCookies");
function cookieHeader(token, maxAge = COOKIE_MAX_AGE) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
__name(cookieHeader, "cookieHeader");
function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
__name(clearCookie, "clearCookie");
async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const computedHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHex === hashHex;
}
__name(verifyPassword, "verifyPassword");
async function getCurrentUser(req, env) {
  const cookieStr = req.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieStr);
  let token = cookies[COOKIE_NAME];
  if (!token) {
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;
  return verifyJwt(token, env);
}
__name(getCurrentUser, "getCurrentUser");
function requireAuth(handler) {
  return async (req, env, params, url) => {
    const user = await getCurrentUser(req, env);
    if (!user) {
      return json({ error: "Unauthorized" }, 401);
    }
    return handler(req, env, params, url, user);
  };
}
__name(requireAuth, "requireAuth");
function getGoogleAuthUrl(state, env) {
  const appBase = env.APP_BASE_URL || DEFAULT_APP_BASE;
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${appBase}/api/auth/callback/google`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent"
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
__name(getGoogleAuthUrl, "getGoogleAuthUrl");
function getGitHubAuthUrl(state, env) {
  const appBase = env.APP_BASE_URL || DEFAULT_APP_BASE;
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `${appBase}/api/auth/callback/github`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "user:email",
    state
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}
__name(getGitHubAuthUrl, "getGitHubAuthUrl");
function getAppleAuthUrl(state, env) {
  const appBase = env.APP_BASE_URL || DEFAULT_APP_BASE;
  const clientId = env.APPLE_CLIENT_ID;
  const redirectUri = `${appBase}/api/auth/callback/apple`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code id_token",
    scope: "name email",
    state,
    response_mode: "form_post"
  });
  return `https://appleid.apple.com/auth/authorize?${params}`;
}
__name(getAppleAuthUrl, "getAppleAuthUrl");
async function exchangeGoogleCode(code, env) {
  const appBase = env.APP_BASE_URL || DEFAULT_APP_BASE;
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appBase}/api/auth/callback/google`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` }
  });
  if (!userRes.ok) return null;
  const userInfo = await userRes.json();
  return {
    provider: "google",
    providerUserId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    avatarUrl: userInfo.picture
  };
}
__name(exchangeGoogleCode, "exchangeGoogleCode");
async function exchangeGitHubCode(code, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  });
  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) return null;
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "who-to-play-with" }
  });
  if (!userRes.ok) return null;
  const userInfo = await userRes.json();
  let email = userInfo.email;
  if (!email) {
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "who-to-play-with" }
    });
    if (emailRes.ok) {
      const emails = await emailRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary ? primary.email : emails[0]?.email;
    }
  }
  return {
    provider: "github",
    providerUserId: String(userInfo.id),
    email: email || `github_${userInfo.id}@unknown`,
    name: userInfo.name || userInfo.login,
    avatarUrl: userInfo.avatar_url
  };
}
__name(exchangeGitHubCode, "exchangeGitHubCode");
async function exchangeAppleCode(code, idToken, env) {
  const appBase = env.APP_BASE_URL || DEFAULT_APP_BASE;
  if (idToken) {
    const parts = idToken.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return {
        provider: "apple",
        providerUserId: payload.sub,
        email: payload.email,
        name: payload.name || "Apple User",
        avatarUrl: null
      };
    }
  }
  const clientId = env.APPLE_CLIENT_ID;
  const teamId = env.APPLE_TEAM_ID;
  const keyId = env.APPLE_KEY_ID;
  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: `${appBase}/api/auth/callback/apple`
    })
  });
  if (!tokenRes.ok) return null;
  const data = await tokenRes.json();
  if (data.id_token) {
    const parts = data.id_token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return {
      provider: "apple",
      providerUserId: payload.sub,
      email: payload.email,
      name: payload.name || "Apple User",
      avatarUrl: null
    };
  }
  return null;
}
__name(exchangeAppleCode, "exchangeAppleCode");
async function createMagicToken(env, email) {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  await env.DB.prepare(`INSERT INTO auth_tokens (token, user_id, email, expires_at, created_at) VALUES (?, '', ?, ?, ?)`).bind(token, email, expiresAt, Date.now()).run();
  return token;
}
__name(createMagicToken, "createMagicToken");
async function verifyMagicToken(env, token) {
  const record = await env.DB.prepare(`SELECT * FROM auth_tokens WHERE token = ? AND used = 0 AND expires_at > ?`).bind(token, Date.now()).first();
  if (!record) return null;
  return record;
}
__name(verifyMagicToken, "verifyMagicToken");
async function markTokenUsed(env, token) {
  await env.DB.prepare(`UPDATE auth_tokens SET used = 1 WHERE token = ?`).bind(token).run();
}
__name(markTokenUsed, "markTokenUsed");
async function findOrCreateUser(env, { provider, providerUserId, email, name, avatarUrl }) {
  let user = await env.DB.prepare(`SELECT * FROM users WHERE auth_provider = ? AND provider_user_id = ?`).bind(provider, providerUserId).first();
  if (!user && email) {
    user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
  }
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO users (id, email, name, avatar_url, auth_provider, provider_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, email, name, avatarUrl || null, provider, providerUserId, Date.now()).run();
    user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
  } else {
    await env.DB.prepare(`UPDATE users SET name = ?, avatar_url = ?, email = ? WHERE id = ?`).bind(name, avatarUrl || null, email, user.id).run();
    user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(user.id).first();
  }
  return user;
}
__name(findOrCreateUser, "findOrCreateUser");
async function migrateUserData(env, userId, friendsData, hangoutsData) {
  const migratedFriendIds = {};
  for (const friend of friendsData) {
    const existing = await env.DB.prepare(`SELECT id FROM friends WHERE id = ? AND user_id = ?`).bind(friend.id, userId).first();
    if (existing) {
      migratedFriendIds[friend.id] = existing.id;
      continue;
    }
    await env.DB.prepare(`INSERT INTO friends (id, user_id, name, tags, phone, birthday, location, how_we_met, important_events, "values", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      friend.id,
      userId,
      friend.name,
      JSON.stringify(friend.tags || []),
      friend.phone || "",
      friend.birthday || "",
      friend.location || "",
      friend.howWeMet || "",
      JSON.stringify(friend.importantEvents || []),
      JSON.stringify(friend.values || []),
      friend.addedAt || Date.now(),
      Date.now()
    ).run();
    migratedFriendIds[friend.id] = friend.id;
  }
  for (const hangout of hangoutsData) {
    const existing = await env.DB.prepare(`SELECT id FROM hangouts WHERE id = ? AND user_id = ?`).bind(hangout.id, userId).first();
    if (existing) continue;
    await env.DB.prepare(`INSERT INTO hangouts (id, user_id, type, quality, duration, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      hangout.id,
      userId,
      hangout.type,
      hangout.quality,
      hangout.duration || "",
      hangout.date,
      hangout.note || hangout.notes || "",
      hangout.createdAt || Date.now()
    ).run();
    for (const friendId of hangout.friendIds || []) {
      const mappedId = migratedFriendIds[friendId];
      if (mappedId) {
        await env.DB.prepare(`INSERT OR IGNORE INTO hangout_friends (hangout_id, friend_id) VALUES (?, ?)`).bind(hangout.id, mappedId).run();
      }
    }
  }
}
__name(migrateUserData, "migrateUserData");
router.add("POST", "/api/auth/:provider", async (req, env, params) => {
  const { provider } = params;
  const appBase = env.APP_BASE_URL || DEFAULT_APP_BASE;
  if (provider === "signup") {
    const { email, password, name } = await req.json();
    if (!email || !password) return json({ error: "Email and password required" }, 400);
    if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return json({ error: "An account with this email already exists" }, 400);
    const passwordHashValue = await hashPassword(password);
    const id = crypto.randomUUID();
    const displayName = name || email.split("@")[0];
    await env.DB.prepare("INSERT INTO users (id, email, name, avatar_url, auth_provider, provider_user_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, email, displayName, null, "email", "", passwordHashValue, Date.now()).run();
    const user = await env.DB.prepare("SELECT id, email, name, avatar_url, auth_provider, created_at FROM users WHERE id = ?").bind(id).first();
    const token = await signJwt({ userId: user.id, email: user.email }, env);
    return new Response(JSON.stringify({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url, authProvider: user.auth_provider } }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Set-Cookie": cookieHeader(token) }
    });
  }
  if (provider === "login") {
    const { email, password } = await req.json();
    if (!email || !password) return json({ error: "Email and password required" }, 400);
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user || !user.password_hash) return json({ error: "Invalid email or password" }, 401);
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ error: "Invalid email or password" }, 401);
    const token = await signJwt({ userId: user.id, email: user.email }, env);
    return new Response(JSON.stringify({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url, authProvider: user.auth_provider } }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": cookieHeader(token) }
    });
  }
  if (provider === "magic") {
    const { email } = await req.json();
    if (!email) return json({ error: "Email required" }, 400);
    const token = await createMagicToken(env, email);
    const magicLink = `${appBase}/#/login?magic=1&token=${token}&email=${encodeURIComponent(email)}`;
    console.log(`Magic link for ${email}: ${magicLink}`);
    return success({ message: "Magic link sent", magicLink: env.NODE_ENV === "development" ? magicLink : null });
  }
  if (!["google", "github", "apple"].includes(provider)) {
    return json({ error: "Unknown provider" }, 400);
  }
  const state = crypto.randomUUID();
  let redirectUrl;
  if (provider === "google") redirectUrl = getGoogleAuthUrl(state, env);
  else if (provider === "github") redirectUrl = getGitHubAuthUrl(state, env);
  else if (provider === "apple") redirectUrl = getAppleAuthUrl(state, env);
  return success({ redirectUrl, state });
});
router.add("GET", "/api/auth/callback/:provider", async (req, env, params) => {
  const { provider } = params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/${"?error="}${error}` }
    });
  }
  let userInfo = null;
  if (provider === "google") userInfo = await exchangeGoogleCode(code, env);
  else if (provider === "github") userInfo = await exchangeGitHubCode(code, env);
  else if (provider === "apple") {
    const idToken = url.searchParams.get("id_token");
    userInfo = await exchangeAppleCode(code, idToken, env);
  }
  if (!userInfo) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/#/login?error=oauth_failed` }
    });
  }
  const user = await findOrCreateUser(env, userInfo);
  const token = await signJwt({ userId: user.id, email: user.email }, env);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/#/auth-callback?token=${token}`,
      "Set-Cookie": cookieHeader(token)
    }
  });
});
router.add("POST", "/api/auth/callback/magic", async (req, env) => {
  const { token } = await req.json();
  if (!token) return json({ error: "Token required" }, 400);
  const record = await verifyMagicToken(env, token);
  if (!record) return json({ error: "Invalid or expired token" }, 400);
  let user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(record.email).first();
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO users (id, email, name, avatar_url, auth_provider, provider_user_id, created_at) VALUES (?, ?, ?, '', 'magic', '', ?)`).bind(id, record.email, record.email.split("@")[0], Date.now()).run();
    user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
  }
  await markTokenUsed(env, token);
  const jwtToken = await signJwt({ userId: user.id, email: user.email }, env);
  return json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url } });
});
router.add("GET", "/api/auth/me", requireAuth(async (req, env, params, url, user) => {
  const dbUser = await env.DB.prepare(`SELECT id, email, name, avatar_url, auth_provider, created_at FROM users WHERE id = ?`).bind(user.userId).first();
  if (!dbUser) return json({ error: "User not found" }, 404);
  return json({ user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, avatarUrl: dbUser.avatar_url, authProvider: dbUser.auth_provider, createdAt: dbUser.created_at } });
}));
router.add("POST", "/api/auth/logout", async (req, env) => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": clearCookie()
    }
  });
});
router.add("GET", "/api/friends", requireAuth(async (req, env, params, url, user) => {
  const friends = await env.DB.prepare(`SELECT * FROM friends WHERE user_id = ? ORDER BY created_at DESC`).bind(user.userId).all();
  return json({
    friends: friends.results.map((f) => ({
      id: f.id,
      name: f.name,
      tags: JSON.parse(f.tags || "[]"),
      phone: f.phone,
      birthday: f.birthday,
      location: f.location,
      howWeMet: f.how_we_met,
      importantEvents: JSON.parse(f.important_events || "[]"),
      values: JSON.parse(f.values || "[]"),
      createdAt: f.created_at,
      updatedAt: f.updated_at
    }))
  });
}));
router.add("POST", "/api/friends", requireAuth(async (req, env, params, url, user) => {
  const body = await req.json();
  const { name, tags, phone, birthday, location, howWeMet, importantEvents, values } = body;
  if (!name) return json({ error: "Name required" }, 400);
  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO friends (id, user_id, name, tags, phone, birthday, location, how_we_met, important_events, "values", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, user.userId, name, JSON.stringify(tags || []), phone || "", birthday || "", location || "", howWeMet || "", JSON.stringify(importantEvents || []), JSON.stringify(values || []), now, now).run();
  return json({ friend: { id, name, tags: tags || [], phone: phone || "", birthday: birthday || "", location: location || "", howWeMet: howWeMet || "", importantEvents: importantEvents || [], values: values || [], createdAt: now, updatedAt: now } }, 201);
}));
router.add("PUT", "/api/friends/:id", requireAuth(async (req, env, params, user) => {
  const { id } = params;
  const body = await req.json();
  const existing = await env.DB.prepare(`SELECT * FROM friends WHERE id = ? AND user_id = ?`).bind(id, user.userId).first();
  if (!existing) return json({ error: "Friend not found" }, 404);
  const updates = [];
  const bindings = [];
  const fields = { name: "name", tags: "tags", phone: "phone", birthday: "birthday", location: "location", howWeMet: "how_we_met", importantEvents: "important_events", values: '"values"' };
  for (const [key, col] of Object.entries(fields)) {
    if (body[key] !== void 0) {
      updates.push(`${col} = ?`);
      bindings.push(key === "tags" || key === "importantEvents" || key === "values" ? JSON.stringify(body[key]) : body[key]);
    }
  }
  updates.push("updated_at = ?");
  bindings.push(Date.now());
  bindings.push(id, user.userId);
  await env.DB.prepare(`UPDATE friends SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`).bind(...bindings).run();
  const updated = await env.DB.prepare(`SELECT * FROM friends WHERE id = ?`).bind(id).first();
  return json({
    friend: {
      id: updated.id,
      name: updated.name,
      tags: JSON.parse(updated.tags || "[]"),
      phone: updated.phone,
      birthday: updated.birthday,
      location: updated.location,
      howWeMet: updated.how_we_met,
      importantEvents: JSON.parse(updated.important_events || "[]"),
      values: JSON.parse(updated.values || "[]"),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    }
  });
}));
router.add("DELETE", "/api/friends/:id", requireAuth(async (req, env, params, user) => {
  const { id } = params;
  const existing = await env.DB.prepare(`SELECT * FROM friends WHERE id = ? AND user_id = ?`).bind(id, user.userId).first();
  if (!existing) return json({ error: "Friend not found" }, 404);
  await env.DB.prepare(`DELETE FROM hangout_friends WHERE friend_id = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM friends WHERE id = ? AND user_id = ?`).bind(id, user.userId).run();
  return success();
}));
router.add("GET", "/api/hangouts", requireAuth(async (req, env, params, url, user) => {
  const hangouts = await env.DB.prepare(`SELECT * FROM hangouts WHERE user_id = ? ORDER BY date DESC`).bind(user.userId).all();
  const result = [];
  for (const h of hangouts.results) {
    const friendsRes = await env.DB.prepare(`SELECT friend_id FROM hangout_friends WHERE hangout_id = ?`).bind(h.id).all();
    result.push({
      id: h.id,
      type: h.type,
      quality: h.quality,
      duration: h.duration,
      date: h.date,
      note: h.notes,
      notes: h.notes,
      friendIds: friendsRes.results.map((r) => r.friend_id),
      createdAt: h.created_at
    });
  }
  return json({ hangouts: result });
}));
router.add("POST", "/api/hangouts", requireAuth(async (req, env, params, url, user) => {
  const body = await req.json();
  const { friendIds, type, duration, quality, note, date } = body;
  if (!type || !date) return json({ error: "Type and date required" }, 400);
  if (!friendIds || friendIds.length === 0) return json({ error: "At least one friend required" }, 400);
  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO hangouts (id, user_id, type, quality, duration, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, user.userId, type, quality || 5, duration || "", date, note || "", now).run();
  for (const friendId of friendIds) {
    await env.DB.prepare(`INSERT OR IGNORE INTO hangout_friends (hangout_id, friend_id) VALUES (?, ?)`).bind(id, friendId).run();
  }
  return json({ hangout: { id, type, quality: quality || 5, duration: duration || "", date, note: note || "", friendIds, createdAt: now } }, 201);
}));
router.add("PUT", "/api/hangouts/:id", requireAuth(async (req, env, params, user) => {
  const { id } = params;
  const body = await req.json();
  const existing = await env.DB.prepare(`SELECT * FROM hangouts WHERE id = ? AND user_id = ?`).bind(id, user.userId).first();
  if (!existing) return json({ error: "Hangout not found" }, 404);
  const updates = [];
  const bindings = [];
  const fields = { type: "type", quality: "quality", duration: "duration", date: "date", note: "notes", notes: "notes" };
  for (const [key, col] of Object.entries(fields)) {
    if (body[key] !== void 0) {
      updates.push(`${col} = ?`);
      bindings.push(body[key]);
    }
  }
  if (body.friendIds) {
    await env.DB.prepare(`DELETE FROM hangout_friends WHERE hangout_id = ?`).bind(id).run();
    for (const friendId of body.friendIds) {
      await env.DB.prepare(`INSERT OR IGNORE INTO hangout_friends (hangout_id, friend_id) VALUES (?, ?)`).bind(id, friendId).run();
    }
  }
  if (updates.length > 0) {
    bindings.push(id, user.userId);
    await env.DB.prepare(`UPDATE hangouts SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`).bind(...bindings).run();
  }
  const updated = await env.DB.prepare(`SELECT * FROM hangouts WHERE id = ?`).bind(id).first();
  const friendsRes = await env.DB.prepare(`SELECT friend_id FROM hangout_friends WHERE hangout_id = ?`).bind(id).all();
  return json({
    hangout: {
      id: updated.id,
      type: updated.type,
      quality: updated.quality,
      duration: updated.duration,
      date: updated.date,
      note: updated.notes,
      notes: updated.notes,
      friendIds: friendsRes.results.map((r) => r.friend_id),
      createdAt: updated.created_at
    }
  });
}));
router.add("DELETE", "/api/hangouts/:id", requireAuth(async (req, env, params, user) => {
  const { id } = params;
  const existing = await env.DB.prepare(`SELECT * FROM hangouts WHERE id = ? AND user_id = ?`).bind(id, user.userId).first();
  if (!existing) return json({ error: "Hangout not found" }, 404);
  await env.DB.prepare(`DELETE FROM hangout_friends WHERE hangout_id = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM hangouts WHERE id = ? AND user_id = ?`).bind(id, user.userId).run();
  return success();
}));
router.add("POST", "/api/data/migrate", requireAuth(async (req, env, params, url, user) => {
  const body = await req.json();
  const { friends, hangouts } = body;
  if (!friends || !hangouts) return json({ error: "friends and hangouts data required" }, 400);
  await migrateUserData(env, user.userId, friends, hangouts);
  return success({ migrated: { friends: friends.length, hangouts: hangouts.length } });
}));
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400"
};
function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(addCorsHeaders, "addCorsHeaders");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (url.pathname.startsWith("/api/")) {
      try {
        const response = await router.dispatch(request, env);
        return addCorsHeaders(response);
      } catch (err) {
        console.error("API error:", err);
        return addCorsHeaders(json({ error: "Internal server error" }, 500));
      }
    }
    return new Response("Not found", { status: 404 });
  }
};

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-0cUQcA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-0cUQcA/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
