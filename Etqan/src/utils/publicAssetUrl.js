'use strict';

/**
 * Resolves `/uploads/...` paths to absolute URLs for DB + mobile clients.
 * Set PUBLIC_BASE_URL (no trailing slash), e.g. https://api.example.com — preferred in production.
 * APP_URL is used as fallback when PUBLIC_BASE_URL is unset.
 *
 * When the env is unset, request Host/proto is used only if `{ req }` is passed so local dev keeps working.
 */
function trimTrailingSlashes(s) {
  return String(s).replace(/\/+$/, '');
}

function baseFromEnv() {
  const raw = process.env.PUBLIC_BASE_URL || process.env.APP_URL || '';
  return trimTrailingSlashes(raw);
}

function baseFromRequest(req) {
  if (!req || typeof req.get !== 'function') return '';
  const xfProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(xfProto) ? xfProto[0] : xfProto) || req.protocol || 'http';
  const xfHost = req.headers['x-forwarded-host'];
  const host = (Array.isArray(xfHost) ? xfHost[0] : xfHost) || req.get('host');
  if (!host) return '';
  const cleanProto = String(proto).split(',')[0].trim().replace(/:+$/, '');
  const cleanHost = String(host).split(',')[0].trim();
  return trimTrailingSlashes(`${cleanProto}://${cleanHost}`);
}

function resolvePublicOrigin(req) {
  return baseFromEnv() || baseFromRequest(req) || '';
}

/** Returns absolute URL when base is known; otherwise leaves relative paths as-is */
function normalizeStoredAssetUrl(urlOrPath, options = {}) {
  const { req } = options;
  if (urlOrPath === null || urlOrPath === undefined) return urlOrPath;
  const s = String(urlOrPath).trim();
  if (s === '') return null;
  if (/^https?:\/\//i.test(s)) return s;

  const base = resolvePublicOrigin(req);
  if (!base) return s.startsWith('/') ? s : `/${s}`;
  const pathPart = s.startsWith('/') ? s : `/${s}`;
  return `${base}${pathPart}`;
}

module.exports = {
  resolvePublicOrigin,
  normalizeStoredAssetUrl,
};
