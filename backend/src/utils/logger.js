// Lightweight logger with namespace-based debug gating
function normalizeBool(val, def = false) {
  if (val === undefined || val === null || val === '') return def;
  const s = String(val).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(s);
}

function isNsEnabled(ns) {
  const LOG_DEBUG = normalizeBool(process.env.LOG_DEBUG, false);
  if (LOG_DEBUG) return true;
  const DEBUG = process.env.DEBUG || '';
  if (!DEBUG) return false;
  const parts = DEBUG.split(',').map(s => s.trim()).filter(Boolean);
  return parts.includes('*') || parts.includes(ns);
}

function createLogger(ns = 'app') {
  const prefix = `[${ns}]`;
  const debugEnabled = () => isNsEnabled(ns);
  return {
    debug: (...args) => { if (debugEnabled()) console.log(prefix, ...args); },
    info: (...args) => console.log(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}

module.exports = { createLogger };
