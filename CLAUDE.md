# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the proxy
node server.js
# or
npm start
```

No build step, no tests, no linting — this is a single-file Node.js server with zero npm runtime dependencies.

## SSL Certificates

The server requires SSL certs before it will start. By default it looks for `./cert.pem` and `./key.pem` in the project root. Generate them with:

```bash
mkcert -install
mkcert -cert-file cert.pem -key-file key.pem localhost
```

## Architecture

All logic lives in [server.js](server.js). It is a plain Node.js HTTPS server (no Express) using only built-in modules (`http`, `https`, `fs`, `path`).

**Request flow:**
1. Client sends `GET https://localhost:9098/https://target.example.com/api/path`
2. Server strips the leading `/` to get the target URL
3. Validates the URL and checks `originWhitelist` from `config.json`
4. Strips `host`, `origin`, `referer` from forwarded headers; sets correct `host`
5. Proxies via `http` or `https` module, strips `removeHeaders` from response, injects CORS headers, pipes back

**Config** ([config.json](config.json)):
- `port` / `host` — server bind address (overridable via `PORT`/`HOST` env vars)
- `ssl.cert` / `ssl.key` — relative paths to PEM files
- `originWhitelist` — allowed request origins; `[]` permits all
- `removeHeaders` — response headers stripped before forwarding (e.g. `x-frame-options`)

## Windows Autostart

- `install-startup.bat` — registers a Windows Task Scheduler task (run as Administrator once)
- `uninstall-startup.bat` — removes the task
- `start-hidden.vbs` — launched by the scheduler; runs `node server.js` without a visible CMD window

## Consumer Integration

After starting, set in the Breece Designer project (`src/js/configs/configs.json`):
```json
"proxy": "https://localhost:9098/"
```
