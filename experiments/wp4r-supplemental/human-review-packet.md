# WP4R Supplemental Human Review Packet

## SUP-A
- ID: SUP-A
- Repo: h3
- Subject: feat: route rules (#1524)
- Base SHA: 5e8a31709b28dbebf2f2f8f1a3063250ec799b74
- Target SHA: 3fae517278a2e677fbe3580918ab069348f80ccc
- File: src/rules/normalize.ts
- Function: normalizeRouteRules
- Line Range: 21-136
- Changed lines: 116 lines (21-136)
- Complete source (target):
```
export function normalizeRouteRules(
  config: Record<string, RouteRuleConfig>,
): Record<string, NormalizedRouteRules> {
  const normalizedRules: Record<string, NormalizedRouteRules> = {};
  for (const key in config) {
    const routeConfig = config[key]!;
    // A typo'd method prefix (`GTE /admin/**`) parses as a literal path
    // containing a space, which never matches a request — a gate authored that
    // way silently fails open, so reject it here instead.
    const unknownMethod = unknownMethodPrefix(key);
    if (unknownMethod !== undefined) {
      throw new Error(
        `[h3] rules: \`${key}\` looks method-scoped but \`${unknownMethod}\` is not a recognized HTTP method — as a literal path this rule can never match. Use one of ${[...HTTP_METHODS].join(", ")}, remove the prefix for an all-methods rule, or add a leading \`/\` for a literal path`,
      );
    }
    const { method, path: rawPath } = parseRouteKey(key);
    // A pattern's literal characters are matched against a decoded reading of
    // the request path, so an escaped one (`/%40admin/**`) has to decode here or
    // it would cover only the encoded spelling (see `decodeRoutePattern`).
    const path = decodeRoutePattern(rawPath);
    const canonicalKey = formatRouteKey(method, path);

    validateBuiltinRules(routeConfig, canonicalKey);

    // Fixed reconstruction order keeps compiler output deterministic.
    const { redirect, proxy, cors, swr, cache, ...rest } = routeConfig;
    const routeRules: Record<string, unknown> = rest;

    if (redirect) {
      const authored: { to?: string; status?: number } =
        typeof redirect === "string" ? { to: redirect } : redirect;
      const redirectOptions: RedirectRuleOptions = { to: "/", status: 307, ...authored };
      if (path.endsWith("/**")) {
        redirectOptions.base = path.slice(0, -3);
      }
      routeRules.redirect = redirectOptions;
    }

    if (proxy) {
      const proxyOptions: ProxyRuleOptions =
        typeof proxy === "string" ? { to: proxy } : { ...proxy };
      if (path.endsWith("/**")) {
        proxyOptions.base = path.slice(0, -3);
      }
      routeRules.proxy = proxyOptions;
    }

    if (cors !== undefined && cors !== false) {
      const corsOptions = cors === true ? {} : { ...cors };
      // Credentialed CORS forbids wildcard origins; falsy origins emit as wildcards too.
      if (
        corsOptions.credentials === true &&
        (!corsOptions.origin ||
          corsOptions.origin === "*" ||
          (Array.isArray(corsOptions.origin) && corsOptions.origin.includes("*")))
      ) {
        throw new Error(
          `[h3] rules: \`cors\` rule for \`${canonicalKey}\` sets \`credentials: true\` with a wildcard origin — \`Access-Control-Allow-Origin: *\` is invalid for credentialed requests; set an explicit \`origin\` allowlist (or validation function)`,
        );
      }
      routeRules.cors = corsOptions;
    }

    // `swr: 0` means revalidate immediately.
    if (swr !== undefined && swr !== false) {
      const cacheOptions: CacheRuleOptions = { ...(cache || undefined) };
      cacheOptions.swr = true;
      if (typeof swr === "number") {
        cacheOptions.maxAge = swr;
      }
      routeRules.cache = cacheOptions;
    } else if (swr === false && cache === undefined) {
      routeRules.cache = false;
    } else if (cache !== undefined && cache !== false) {
      routeRules.cache = cache;
    }

    if (cache === false) {
      routeRules.cache = false;
    }
    if (redirect === false) {
      routeRules.redirect = false;
    }
    if (proxy === false) {
      routeRules.proxy = false;
    }
    if (cors === false) {
      routeRules.cors = false;
    }

    // Reject prototype-polluting names and values with ambiguous merge semantics.
    for (const name in routeRules) {
      if (name === "__proto__" || name === "constructor" || name === "prototype") {
        throw new Error(
          `[h3] rules: \`${name}\` is a reserved name and cannot be used as a rule for \`${canonicalKey}\``,
        );
      }
      if (Array.isArray(routeRules[name])) {
        throw new Error(
          `[h3] rules: \`${name}\` rule for \`${canonicalKey}\` is an array — rule options cannot be top-level arrays (ambiguous merge semantics); wrap it in an object`,
        );
      }
    }

    // Canonical keys may collide (`"get /x"` and `"GET /x"`).
    const existing = normalizedRules[canonicalKey];
    if (existing) {
      for (const [name, options] of Object.entries(routeRules)) {
        existing[name] = mergeRuleOptions(existing[name], options);
      }
    } else {
      normalizedRules[canonicalKey] = routeRules as NormalizedRouteRules;
    }
  }
  return normalizedRules;
}
```
- Exact diff:
```
diff --git a/src/rules/normalize.ts b/src/rules/normalize.ts
index 0000000..0000000
--- /dev/null
+++ b/src/rules/normalize.ts
@@ -0,0 +1,169 @@
+import {
+  HTTP_METHODS,
+  decodeRoutePattern,
+  formatRouteKey,
+  parseRouteKey,
+  unknownMethodPrefix,
+} from "./internal/key.ts";
+import { mergeRuleOptions } from "./merge.ts";
+import type {
+  CacheRuleOptions,
+  NormalizedRouteRules,
+  ProxyRuleOptions,
+  RedirectRuleOptions,
+  RouteRuleConfig,
+} from "./types.ts";
+
+/**
+ * Normalize authored route rules by expanding shortcuts, canonicalizing keys,
+ * and validating built-in options. Custom rules pass through unchanged.
+ */
+export function normalizeRouteRules(
+  config: Record<string, RouteRuleConfig>,
+): Record<string, NormalizedRouteRules> {
+  const normalizedRules: Record<string, NormalizedRouteRules> = {};
+  for (const key in config) {
+    const routeConfig = config[key]!;
+    // A typo'd method prefix (`GTE /admin/**`) parses as a literal path
+    // containing a space, which never matches a request — a gate authored that
+    // way silently fails open, so reject it here instead.
+    const unknownMethod = unknownMethodPrefix(key);
+    if (unknownMethod !== undefined) {
+      throw new Error(
+        `[h3] rules: \`${key}\` looks method-scoped but \`${unknownMethod}\` is not a recognized HTTP method — as a literal path this rule can never match. Use one of ${[...HTTP_METHODS].join(", ")}, remove the prefix for an all-methods rule, or add a leading \`/\` for a literal path`,
+      );
+    }
+    const { method, path: rawPath } = parseRouteKey(key);
+    // A pattern's literal characters are matched against a decoded reading of
+    // the request path, so an escaped one (`/%40admin/**`) has to decode here or
+    // it would cover only the encoded spelling (see `decodeRoutePattern`).
+    const path = decodeRoutePattern(rawPath);
+    const canonicalKey = formatRouteKey(method, path);
+
+    validateBuiltinRules(routeConfig, canonicalKey);
+
+    // Fixed reconstruction order keeps compiler output deterministic.
+    const { redirect, proxy, cors, swr, cache, ...rest } = routeConfig;
+    const routeRules: Record<string, unknown> = rest;
+
+    if (redirect) {
+      const authored: { to?: string; status?: number } =
+        typeof redirect === "string" ? { to: redirect } : redirect;
+      const redirectOptions: RedirectRuleOptions = { to: "/", status: 307, ...authored };
+      if (path.endsWith("/**")) {
+        redirectOptions.base = path.slice(0, -3);
+      }
+      routeRules.redirect = redirectOptions;
+    }
+
+    if (proxy) {
+      const proxyOptions: ProxyRuleOptions =
+        typeof proxy === "string" ? { to: proxy } : { ...proxy };
+      if (path.endsWith("/**")) {
+        proxyOptions.base = path.slice(0, -3);
+      }
+      routeRules.proxy = proxyOptions;
+    }
+
+    if (cors !== undefined && cors !== false) {
+      const corsOptions = cors === true ? {} : { ...cors };
+      // Credentialed CORS forbids wildcard origins; falsy origins emit as wildcards too.
+      if (
+        corsOptions.credentials === true &&
+        (!corsOptions.origin ||
+          corsOptions.origin === "*" ||
+          (Array.isArray(corsOptions.origin) && corsOptions.origin.includes("*")))
+      ) {
+        throw new Error(
+          `[h3] rules: \`cors\` rule for \`${canonicalKey}\` sets \`credentials: true\` with a wildcard origin — \`Access-Control-Allow-Origin: *\` is invalid for credentialed requests; set an explicit \`origin\` allowlist (or validation function)`,
+        );
+      }
+      routeRules.cors = corsOptions;
+    }
+
+    // `swr: 0` means revalidate immediately.
+    if (swr !== undefined && swr !== false) {
+      const cacheOptions: CacheRuleOptions = { ...(cache || undefined) };
+      cacheOptions.swr = true;
+      if (typeof swr === "number") {
+        cacheOptions.maxAge = swr;
+      }
+      routeRules.cache = cacheOptions;
+    } else if (swr === false && cache === undefined) {
+      routeRules.cache = false;
+    } else if (cache !== undefined && cache !== false) {
+      routeRules.cache = cache;
+    }
+
+    if (cache === false) {
+      routeRules.cache = false;
+    }
+    if (redirect === false) {
+      routeRules.redirect = false;
+    }
+    if (proxy === false) {
+      routeRules.proxy = false;
+    }
+    if (cors === false) {
+      routeRules.cors = false;
+    }
+
+    // Reject prototype-polluting names and values with ambiguous merge semantics.
+    for (const name in routeRules) {
+      if (name === "__proto__" || name === "constructor" || name === "prototype") {
+        throw new Error(
+          `[h3] rules: \`${name}\` is a reserved name and cannot be used as a rule for \`${canonicalKey}\``,
+        );
+      }
+      if (Array.isArray(routeRules[name])) {
+        throw new Error(
+          `[h3] rules: \`${name}\` rule for \`${canonicalKey}\` is an array — rule options cannot be top-level arrays (ambiguous merge semantics); wrap it in an object`,
+        );
+      }
+    }
+
+    // Canonical keys may collide (`"get /x"` and `"GET /x"`).
+    const existing = normalizedRules[canonicalKey];
+    if (existing) {
+      for (const [name, options] of Object.entries(routeRules)) {
+        existing[name] = mergeRuleOptions(existing[name], options);
+      }
+    } else {
+      normalizedRules[canonicalKey] = routeRules as NormalizedRouteRules;
+    }
+  }
+  return normalizedRules;
+}
```
- CC: 36
- Coverage: 100% (stmt)
- CRAP: 36
- Coverage artifact: experiments/wp4r-supplemental/sup-a/coverage-final.json
- Istanbul attribution:
  - Keys: ["b","branchMap","f","fnMap","meta","path","s","statementMap"]
  - fnMap for normalizeRouteRules: {
    "name": "normalizeRouteRules",
    "decl": {
      "start": {
        "line": 21,
        "column": 16
      },
      "end": {
        "line": 21,
        "column": null
      }
    },
    "loc": {
      "start": {
        "line": 23,
        "column": 40
      },
      "end": {
        "line": 136,
        "column": null
      }
    },
    "line": 23
  }
- Threshold 30 result: gate=WARN, ruleResults for normalizeRouteRules: {result: "WARN", crap: 36, threshold: 30, cc: 36, coverage: 100}
- Threshold 15 result: gate=WARN, ruleResults for normalizeRouteRules: {result: "WARN", crap: 36, threshold: 15, cc: 36, coverage: 100}
- Factual logic description: The function normalizeRouteRules has CC=36 and coverage=100%, resulting in CRAP=36. At threshold 30, the function exceeds the threshold (36>30) causing a WARN gate. At threshold 15, the function also exceeds the threshold (36>15) causing a WARN gate.
- Exact commands:
  - Checkout target: `git -C /private/tmp/wp4r1-h3 checkout 3fae517278a2e677fbe3580918ab069348f80ccc`
  - Generate coverage: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` (in /private/tmp/wp4r1-h3)
  - Run prototype at threshold 30: `node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base 5e8a31709b28dbebf2f2f8f1a3063250ec799b74 --coverage-file /private/tmp/wp4r1-h3/coverage/coverage-final.json --json > experiments/wp4r-supplemental/sup-a/output-threshold-30.json`
  - Run prototype at threshold 15: \`node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base 5e8a31709b28dbebf2f2f8f1a3063250ec799b74 --coverage-file /private/tmp/wp4r1-h3/coverage/coverage-final.json --crap-threshold 15 --json > experiments/wp4r-supplemental/sup-a/output-threshold-15.json\`

### Human Review — SUP-A

Question: Does the threshold-30 WARN identify a changed function that merits advisory attention?

- [ ] EXPECTED_WARN
- [ ] QUESTIONABLE_WARN
- [ ] UNDETERMINED

**Rationale:** _(human reviewer completes)_

---

## SUP-B
- ID: SUP-B
- Repo: h3
- Subject: fix(json-rpc)!: require JSON content-type, validate origin and cap batch size
- Base SHA: 07d22ecdb175416231242f7ea1ae8553ca0cc1fe
- Target SHA: 72d8e05fb8a9a0eb6941d0c6f11b69b543452260
- File: src/utils/json-rpc.ts
- Function: processJsonRpcMethod
- Line Range: 404-500
- Changed lines: 97 lines (404-500)
- Complete source (target):
```
async function processJsonRpcMethod<C extends H3Event | WebSocketPeer>(
  raw: unknown,
  methodMap: Record<string, (data: JsonRpcRequest, context: C) => unknown | Promise<unknown>>,
  context: C,
): Promise<JsonRpcResponse | undefined> {
  // Each item in a batch must be an object.
  // Per spec §6 examples: [1,2,3] → array of Invalid Request errors.
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return createJsonRpcError(null, INVALID_REQUEST, "Invalid Request");
  }

  const req = raw as Record<string, unknown>;

  // Validate the request structure per §4.
  if (
    req.jsonrpc !== "2.0" ||
    typeof req.method !== "string" ||
    ("id" in req && !isValidId(req.id))
  ) {
    // When the request is invalid, use id if it's a valid type, otherwise null.
    const id = "id" in req && isValidId(req.id) ? req.id : null;
    return createJsonRpcError(id, INVALID_REQUEST, "Invalid Request");
  }

  // Validate params type if present (§4.2: MUST be Array or Object).
  if (
    "params" in req &&
    req.params !== undefined &&
    (typeof req.params !== "object" || req.params === null)
  ) {
    return isNotification(req)
      ? undefined
      : createJsonRpcError(req.id as string | number | null, INVALID_PARAMS, "Invalid params");
  }

  // Per spec §8: method names starting with "rpc." are reserved.
  if ((req.method as string).startsWith("rpc.")) {
    return isNotification(req)
      ? undefined
      : createJsonRpcError(req.id as string | number | null, METHOD_NOT_FOUND, "Method not found");
  }

  const method = req.method as string;
  const params = req.params as JsonRpcParams | undefined;
  const notification = isNotification(req);
  const id = notification ? undefined : (req.id as string | number | null);

  // Safe method lookup from the null-prototype map.
  const methodHandler = methodMap[method];

  // If the method is not found return an error unless it's a notification, as per §4.1.
  if (!methodHandler) {
    return notification ? undefined : createJsonRpcError(id!, METHOD_NOT_FOUND, "Method not found");
  }

  // Execute the method handler.
  try {
    const rpcReq: JsonRpcRequest = { jsonrpc: "2.0", method, params };
    if (!notification) {
      rpcReq.id = id;
    }

    const result = await methodHandler(rpcReq, context);

    // For notifications, the server MUST NOT reply (§4.1).
    return notification ? undefined : { jsonrpc: "2.0" as const, id: id!, result: result ?? null };
  } catch (error_: any) {
    // For notifications, errors are silently discarded (§4.1).
    if (notification) {
      return undefined;
    }

    // If the handler throws, wrap it in a JSON-RPC error response.
    //
    // Never expose internal exception details to untrusted callers: only an
    // `HTTPError` the app threw itself may surface its `message`/`data`.
    // `unhandled` errors are framework-wrapped internal exceptions whose
    // message is lifted from an arbitrary `cause` (e.g. `fromNodeHandler`
    // wrapping a driver error), so they are masked here exactly like
    // `HTTPError.toJSON()` masks them (see `src/error.ts`).
    const isExposable = HTTPError.isError(error_) && !error_.unhandled;
    const h3Error = isExposable
      ? error_
      : {
          status: HTTPError.isError(error_) ? error_.status : 500,
          message: "Internal error",
          data: undefined,
        };
    const statusCode = h3Error.status;
    const statusMessage = h3Error.message;

    // Map HTTP status codes to semantically appropriate JSON-RPC error codes.
    const errorCode = mapHttpStatusToJsonRpcError(statusCode);

    return createJsonRpcError(id!, errorCode, statusMessage, h3Error.data);
  }
}
```
- Exact diff:
```
diff --git a/src/utils/json-rpc.ts b/src/utils/json-rpc.ts
index 0000000..0000000
--- /dev/null
+++ b/src/utils/json-rpc.ts
@@ -3,6 +3,7 @@ import type { Hooks as WebSocketHooks, Peer as WebSocketPeer } from "crossws";
+import { isCorsOriginAllowed } from "./internal/cors.ts";
 import { HTTPError } from "../error.ts";
 import { HTTPResponse } from "../response.ts";
 
@@ -65,9 +66,17 @@ const INVALID_REQUEST = -32_600; // The JSON sent is not a valid Request object.
+// Default upper bound for the number of requests in a single batch.
+const DEFAULT_MAX_BATCH_SIZE = 50;
+
 /**
  * Creates an H3 event handler that implements the JSON-RPC 2.0 specification.
  *
+ * **Security defaults:** requests must have a JSON `Content-Type` (CSRF, see
+ * `validateContentType`), cross-origin requests are rejected (CSRF and DNS
+ * rebinding, see `allowedOrigins`), and batches are capped at 50 requests
+ * (fan-out amplification, see `maxBatchSize`).
+ *
    * @param methods A map of RPC method names to their handler functions.
    * @param middleware Optional middleware to apply to the handler.
    * @returns An H3 EventHandler.
  @@ -90,14 +99,86 @@ const INVALID_PARAMS = -32_602; // Invalid method parameter(s).
  +
  +    /**
  +     * Maximum number of requests allowed in a single batch.
  +     *
  +     * Every batch item is dispatched concurrently, so an unbounded batch turns
  +     * one HTTP request into an arbitrary number of method invocations
  +     * (per-request rate limiters and quotas count it once) and fans out to
  +     * upstreams and database pools. Batches larger than this are rejected with
  +     * an `Invalid Request` (`-32600`) error.
  +     *
  +     * Set to `Infinity` to disable the limit.
  +     *
  +     * @default 50
  +     */
  +    maxBatchSize?: number;
  +
  +    /**
  +     * Require a JSON `Content-Type` (`application/json`, `application/json-rpc`
  +     * or any `+json` media type) and reject anything else with a `415`.
  +     *
  +     * This is a CSRF defense: without it, an HTML form (or a typeless `fetch`
  +     * body) from an attacker page qualifies as a CORS "simple request" and is
  +     * delivered with the victim's cookies without any preflight. Requiring a
  +     * JSON content type forces a preflight for cross-origin callers.
  +     *
  +     * @default true
  +     */
  +    validateContentType?: boolean;
  +
  +    /**
  +     * Origins allowed to call this endpoint.
  +     *
  +     * By default only same-origin requests are accepted: a request carrying an
  +     * `Origin` header that does not match the request's own origin is rejected
  +     * with a `403`. Requests without an `Origin` header (CLI clients,
  +     * server-to-server, MCP stdio bridges) are always allowed.
  +     *
  +     * Pass an explicit allowlist to accept specific cross-origin callers, or
  +     * `"*"` to disable the check entirely. An allowlist **replaces** the
  +     * same-origin default rather than extending it, so include this endpoint's
  +     * own origin as well when browsers served from it call it too.
  +     *
  +     * **Behind a proxy:** the same-origin default compares against
  +     * `event.url.origin`, derived from the request's own protocol and `Host`.
  +     * A TLS-terminating proxy leaves that `http:` while the browser sends an
  +     * `https:` `Origin`, so same-origin requests are rejected. Start the server
  +     * with srvx `trustProxy` when a proxy you control rewrites `X-Forwarded-*`,
  +     * or pass an explicit allowlist of the origins they expect (e.g. `["http://localhost:3000"]`).
  +     *
  +     * **Security:** the MCP Streamable HTTP transport requires servers to
  +     * validate `Origin` to prevent DNS-rebinding attacks. The same-origin
  +     * default does not stop rebinding on its own (the rebound name is both the
  +     * `Origin` and the `Host`); locally bound servers should pass an explicit
  +     * allowlist of the origins they expect (e.g. `["http://localhost:3000"]`).
  +     *
  +     * Regular expressions are tested **unanchored** — always anchor them
  +     * (`/^https:\/\/app\.example\.com$/`).
  +     */
  +    allowedOrigins?: "*" | string | (string | RegExp)[] | ((origin: string) => boolean);
     } = {} as any,
   ): EventHandler<RequestT> {
     const methodMap = createMethodMap(opts.methods);
   +  const maxBatchSize = opts.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
     const handler = async (event: H3Event) => {
       // JSON-RPC requests MUST be POST.
       if (event.req.method !== "POST") {
         throw new HTTPError({ status: 405 });
       }
  +
  +    // Reject non-JSON content types (CSRF: see `validateContentType`).
  +    if (
  +      opts.validateContentType !== false &&
  +      !isJsonContentType(event.req.headers.get("content-type"))
  +    ) {
  +      throw new HTTPError({ status: 415, message: "Unsupported Media Type" });
  +    }
  +
  +    // Reject disallowed origins (CSRF / DNS rebinding: see `allowedOrigins`).
  +    assertAllowedOrigin(event, opts.allowedOrigins);
  +
       let body: unknown;
       try {
         body = await event.req.json();
  @@ -109,12 +190,52 @@ export function defineJsonRpcHandler<RequestT extends EventHandlerRequest = Even
  -    const result = await processJsonRpcBody(body, methodMap, event);
  +    const result = await processJsonRpcBody(body, methodMap, event, maxBatchSize);
       return result === undefined ? new HTTPResponse("", { status: 202 }) : result;
     };
     return defineHandler<RequestT>({ ...opts, handler });
   }
  +
  +/**
  + * Check that a request `Content-Type` is a JSON media type.
  + */
  +function isJsonContentType(value: string | null): boolean {
  +  if (!value) {
  +    return false;
  +  }
  +  const mediaType = value.split(";")[0].trim().toLowerCase();
  +  return (
  +    mediaType === "application/json" ||
  +    mediaType === "application/json-rpc" ||
  +    mediaType.endsWith("+json")
  +  );
  +}
  +
  +/**
  + * Validate the request `Origin` against the allowed origins (default: same-origin only).
  + */
  +function assertAllowedOrigin(
  +  event: H3Event,
  +  allowedOrigins: "*" | string | (string | RegExp)[] | ((origin: string) => boolean) | undefined,
  +): void {
  +  const origin = event.req.headers.get("origin");
  +
  +  // Non-browser clients send no `Origin` and are not subject to CSRF.
  +  if (!origin || allowedOrigins === "*") {
  +    return;
  +  }
  + 
  +  const allowed = allowedOrigins
  +    ? isCorsOriginAllowed(origin, {
  +        origin: typeof allowedOrigins === "string" ? [allowedOrigins] : allowedOrigins,
  +      })
  +    : origin === event.url.origin;
  +
  +  if (!allowed) {
  +    throw new HTTPError({ status: 403, message: "Origin not allowed" });
  +  }
  +}
  +
   /**
    * Creates an H3 event handler that implements JSON-RPC 2.0 over WebSocket.
    *
  @@ -122,6 +243,12 @@ export function defineJsonRpcHandler<RequestT extends EventHandlerRequest = Even
  + * **Security:** unlike `defineJsonRpcHandler()`, this does not check the request
  + * `Origin`. WebSocket upgrades are not subject to CORS, so a page on any origin
  +   can open a connection carrying the visitor's cookies (cross-site WebSocket
  +   * hijacking). Validate `Origin` in the `upgrade` hook and throw a `Response` to
  +   * abort the connection.
  +   *
    * @param opts Options including methods map and optional WebSocket hooks.
    * @returns An H3 EventHandler that upgrades to a WebSocket connection.
    *
  @@ -161,9 +288,24 @@ export function defineJsonRpcHandler<RequestT extends EventHandlerRequest = Even
  +
  +  /**
  +   * Maximum number of requests allowed in a single batch message.
  +   *   * Batch items are dispatched concurrently, so an unbounded batch lets a
  +   *   * single message fan out to an arbitrary number of method invocations.
  +   *   * Larger batches are rejected with an `Invalid Request` (`-32600`) error.
  +   *   *
  +   *   * Set to `Infinity` to disable the limit.
  +   *   *
  +   *   * @default 50
  +   *   */
  +   maxBatchSize?: number;
  +
     hooks?: Partial<Omit<WebSocketHooks, "message">>;
   }): EventHandler {
     const methodMap = createMethodMap(opts.methods);
   +  const maxBatchSize = opts.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
     return defineWebSocketHandler({
       ...opts.hooks,
       async message(peer, message) {
  @@ -174,7 +316,7 @@ export function defineJsonRpcWebSocketHandler(opts: {
  -      const result = await processJsonRpcBody(body, methodMap, peer);
  +      const result = await processJsonRpcBody(body, methodMap, peer, maxBatchSize);
         if (result !== undefined) {
           peer.send(JSON.stringify(result));
         }
  @@ -208,6 +350,7 @@ async function processJsonRpcBody<C extends H3Event | WebSocketPeer>(
  +  maxBatchSize: number,
   ): Promise<JsonRpcResponse | JsonRpcResponse[] | undefined> {
     // Body must be a non-null object or array.
     // Note: parsing already succeeded here, so a primitive body is not a Parse
  @@ -223,6 +366,16 @@ async function processJsonRpcBody<C extends H3Event | WebSocketPeer>(
  +  // Bound the fan-out: every item is dispatched concurrently below, so an
  +  // unbounded batch amplifies one request into unlimited method invocations.
  +  if (requests.length > maxBatchSize) {
  +    return createJsonRpcError(
  +      null,
  +      INVALID_REQUEST,
  +      `Invalid Request: batch size exceeds maximum of ${maxBatchSize}`,
  +    );
  +  }
  +
     const responses = await Promise.all(
       requests.map((raw) => processJsonRpcMethod(raw, methodMap, context)),
     );
  @@ -321,15 +474,19 @@ async function processJsonRpcMethod<C extends H3Event | WebSocketPeer>(
  -    const h3Error = HTTPError.isError(error_)
  +    //
  +    // Never expose internal exception details to untrusted callers: only an
  +    // `HTTPError` the app threw itself may surface its `message`/`data`.
  +    // `unhandled` errors are framework-wrapped internal exceptions whose
  +    // message is lifted from an arbitrary `cause` (e.g. `fromNodeHandler`
  +    // wrapping a driver error), so they are masked here exactly like
  +   +    // `HTTPError.toJSON()` masks them (see `src/error.ts`).
  +    const isExposable = HTTPError.isError(error_) && !error_.unhandled;
  +    const h3Error = isExposable
         ? error_
         : {
  -          status: 500,
  +          status: HTTPError.isError(error_) ? error_.status : 500,
             message: "Internal error",
  -          // Never expose internal exception details to untrusted callers.
  -          // Consistent with `HTTPError.toJSON()` hiding `data`/`message` for
  -          // unhandled errors (see `src/error.ts`). Thrown `HTTPError`s keep
  -          // their opt-in `data`/`message` via the branch above.
             data: undefined,
           };
       const statusCode = h3Error.status;
   }
```
- CC: 28
- Coverage: 89.36170212765957% (branch)
- CRAP: 28.94391416160196
- Coverage artifact: experiments/wp4r-supplemental/sup-b/coverage-final.json
- Istanbul attribution:
  - Keys: ["b","branchMap","f","fnMap","meta","path","s","statementMap"]
  - fnMap for processJsonRpcMethod: {
    "name": "processJsonRpcMethod",
    "decl": {
      "start": {
        "line": 404,
        "column": 15
      },
      "end": {
        "line": 404,
        "column": null
      }
    },
    "loc": {
      "start": {
        "line": 408,
        "column": 40
      },
      "end": {
        "line": 500,
        "column": null
      }
    },
    "line": 408
  }
- Threshold 30 result: gate=PASS, ruleResults for processJsonRpcMethod: {result: "PASS", crap: 28.94391416160196, threshold: 30, cc: 28, coverage: 89.36170212765957}
- Threshold 15 result: gate=WARN, ruleResults for processJsonRpcMethod: {result: "WARN", crap: 28.94391416160196, threshold: 15, cc: 28, coverage: 89.36170212765957}
- Factual logic description: The function processJsonRpcMethod has CC=28 and coverage=89.36170212765957%, resulting in CRAP=28.94391416160196. At threshold 30, the function does not exceed the threshold (28.94<=30) causing a PASS gate. At threshold 15, the function exceeds the threshold (28.94>15) causing a WARN gate.
- Exact commands:
  - Checkout target: `git -C /private/tmp/wp4r1-h3 checkout 72d8e05fb8a9a0eb6941d0c6f11b69b543452260`
  - Generate coverage: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` (in /private/tmp/wp4r1-h3)
  - Run prototype at threshold 30: `node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base 07d22ecdb175416231242f7ea1ae8553ca0cc1fe --coverage-file /private/tmp/wp4r1-h3/coverage/coverage-final.json --json > experiments/wp4r-supplemental/sup-b/output-threshold-30.json`
  - Run prototype at threshold 15: `node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base 07d22ecdb175416231242f7ea1ae8553ca0cc1fe --coverage-file /private/tmp/wp4r1-h3/coverage/coverage-final.json --crap-threshold 15 --json > experiments/wp4r-supplemental/sup-b/output-threshold-15.json`

### Human Review — SUP-B at Threshold 30

Question: Does passing this function at threshold 30 appear reasonable?

- [ ] EXPECTED_PASS
- [ ] QUESTIONABLE_PASS
- [ ] UNDETERMINED

**Rationale:** _(human reviewer completes)_

### Human Review — SUP-B at Threshold 15

Question: Does lowering the threshold to 15 add useful advisory signal, or primarily noise?

- [ ] USEFUL_WARN
- [ ] NOISY_WARN
- [ ] UNDETERMINED

**Rationale:** _(human reviewer completes)_
