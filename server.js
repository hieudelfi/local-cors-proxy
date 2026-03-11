/**
 * Breece Local CORS Proxy (HTTPS)
 * Drop-in replacement for cors-anywhere.herokuapp.com
 * Zero third-party runtime dependencies (uses built-in http/https/fs only).
 *
 * Usage:  node server.js  (or via start.bat)
 * Config: edit config.json, then restart.
 *
 * After starting, set in src/js/configs/configs.json:
 *   "proxy": "https://localhost:8080/"
 *
 * Request format (same as cors-anywhere):
 *   GET https://localhost:8080/https://cloudapi.breecesystem.com/api/endpoint
 */

'use strict';

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const config = require('./config.json');

const PORT             = parseInt(process.env.PORT || config.port  || 8080);
const HOST             = process.env.HOST           || config.host || 'localhost';
const ORIGIN_WHITELIST = config.originWhitelist    || [];
const REMOVE_HEADERS   = (config.removeHeaders     || []).map(h => h.toLowerCase());

// ── Load SSL certificates ─────────────────────────────────────────────────────
const sslCertPath = path.resolve(__dirname, config.ssl.cert);
const sslKeyPath  = path.resolve(__dirname, config.ssl.key);

let sslOptions;
try {
    sslOptions = {
        cert: fs.readFileSync(sslCertPath),
        key:  fs.readFileSync(sslKeyPath)
    };
} catch (err) {
    console.error('[error] Failed to load SSL certificates:');
    console.error('  cert:', sslCertPath);
    console.error('  key :', sslKeyPath);
    console.error('  →', err.message);
    console.error('\n  Generate certs with mkcert:');
    console.error('    mkcert localhost');
    console.error('  Then update cors-proxy/config.json ssl paths.\n');
    process.exit(1);
}

// ── CORS response headers ─────────────────────────────────────────────────────
function corsHeaders(reqHeaders) {
    return {
        'access-control-allow-origin':      reqHeaders['origin'] || '*',
        'access-control-allow-methods':     'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'access-control-allow-headers':     reqHeaders['access-control-request-headers'] || '*',
        'access-control-allow-credentials': 'true',
        'access-control-max-age':           '86400',
        'x-cors-proxy':                     'breece-local'
    };
}

function sendError(res, status, message, reqHeaders) {
    res.writeHead(status, { 'content-type': 'text/plain', ...corsHeaders(reqHeaders || {}) });
    res.end(message);
}

// ── Main request handler ──────────────────────────────────────────────────────
function handleRequest(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders(req.headers));
        return res.end();
    }

    // Target URL is everything after the leading slash
    // e.g. /https://cloudapi.breecesystem.com/api/foo
    const targetUrl = req.url.slice(1);

    if (!targetUrl) {
        return sendError(res, 400,
            'No target URL.\nUsage: https://' + HOST + ':' + PORT + '/https://example.com/path',
            req.headers
        );
    }

    // Validate URL
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        return sendError(res, 400, 'Invalid target URL: ' + targetUrl, req.headers);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return sendError(res, 400, 'Only http and https targets are allowed.', req.headers);
    }

    // Origin whitelist (empty = allow all)
    const origin = req.headers['origin'] || '';
    if (ORIGIN_WHITELIST.length && !ORIGIN_WHITELIST.includes(origin)) {
        return sendError(res, 403, 'Origin not allowed: ' + origin, req.headers);
    }

    // Build forwarded headers
    const fwdHeaders = Object.assign({}, req.headers);
    delete fwdHeaders['host'];
    delete fwdHeaders['origin'];
    delete fwdHeaders['referer'];
    fwdHeaders['host'] = parsed.host;

    const options = {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method:   req.method,
        headers:  fwdHeaders
    };

    const transport = parsed.protocol === 'https:' ? https : http;

    const proxyReq = transport.request(options, (proxyRes) => {
        // Filter unwanted response headers, then add CORS headers
        const outHeaders = {};
        for (const [k, v] of Object.entries(proxyRes.headers)) {
            if (!REMOVE_HEADERS.includes(k.toLowerCase())) {
                outHeaders[k] = v;
            }
        }
        Object.assign(outHeaders, corsHeaders(req.headers));

        res.writeHead(proxyRes.statusCode, outHeaders);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('[proxy error]', req.method, targetUrl, '-', err.message);
        if (!res.headersSent) {
            sendError(res, 502, 'Proxy error: ' + err.message, req.headers);
        }
    });

    req.pipe(proxyReq, { end: true });
}

// ── Start HTTPS server ────────────────────────────────────────────────────────
https.createServer(sslOptions, handleRequest).listen(PORT, HOST, () => {
    console.log('');
    console.log('  Breece CORS Proxy running (HTTPS)');
    console.log('  ─────────────────────────────────────────');
    console.log(`  Proxy URL : https://${HOST}:${PORT}/`);
    console.log(`  Allowed   : ${ORIGIN_WHITELIST.length ? ORIGIN_WHITELIST.join(', ') : '(all origins)'}`);
    console.log(`  Cert      : ${sslCertPath}`);
    console.log('  ─────────────────────────────────────────');
    console.log('  configs.json update needed:');
    console.log('    "proxy": "https://' + HOST + ':' + PORT + '/"');
    console.log('  Press Ctrl+C to stop.');
    console.log('');
});

process.on('SIGINT', () => {
    console.log('\n  Proxy stopped.');
    process.exit(0);
});
