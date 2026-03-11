# Breece Local CORS Proxy

A local HTTPS CORS proxy — drop-in replacement for `cors-anywhere.herokuapp.com`.

---

## Prerequisites

- [Node.js](https://nodejs.org) installed
- [mkcert](https://github.com/FiloSottile/mkcert) installed (for trusted local SSL certs)

---

## 1. Generate SSL Certificates

The proxy runs over HTTPS and requires a trusted local certificate. Run these commands **once** from the **root of this repo**:

```bash
mkcert -install
mkcert -cert-file cert.pem -key-file key.pem localhost
```

This creates `cert.pem` and `key.pem` in the project root. The default `config.json` already points to `./cert.pem` and `./key.pem`.

---

## 2. Install Dependencies

From inside this folder:

```bash
npm install
```

> There are no runtime dependencies — this only sets up the project metadata.

---

## 3. Start the Server (Manual)

**Option A — double-click:**

Run `start.bat`

**Option B — terminal:**

```bash
node server.js
```

The proxy will be available at `https://localhost:8080/`.

---

## 4. Configure Breece Designer

In the Breece Designer project, open `src/js/configs/configs.json` and set:

```json
"proxy": "https://localhost:8080/"
```

---

## 5. Auto-Start with Windows (Optional)

To have the proxy start automatically every time you log in to Windows:

1. Right-click `install-startup.bat` → **Run as Administrator**
2. Done — the proxy will start silently on every login (no CMD window)

To remove the startup task:

1. Run `uninstall-startup.bat`

> The startup task uses `start-hidden.vbs` to launch Node without a visible window.
> To check if it's running: open **Task Manager → Details** and look for `node.exe`.

---

## Configuration

Edit `config.json` to change settings, then restart the server.

| Key | Default | Description |
|-----|---------|-------------|
| `port` | `8080` | Port the proxy listens on |
| `host` | `localhost` | Host/interface to bind |
| `ssl.cert` | `../cert.pem` | Path to SSL certificate |
| `ssl.key` | `../key.pem` | Path to SSL private key |
| `originWhitelist` | `["https://localhost:9000"]` | Allowed request origins. Set to `[]` to allow all. |
| `removeHeaders` | `["x-frame-options", ...]` | Response headers to strip before forwarding |

---

## Usage

Prefix any target URL with the proxy address:

```
https://localhost:8080/https://cloudapi.breecesystem.com/api/endpoint
```
