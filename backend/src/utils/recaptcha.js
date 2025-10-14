const axios = require('axios');
const { createLogger } = require('./logger');
const log = createLogger('recaptcha');

function normalizeBool(val, def = false) {
  if (val === undefined || val === null || val === '') return def;
  const s = String(val).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(s);
}

async function verifyRecaptcha({ token, req, context = 'login' }) {
  const enabled = normalizeBool(process.env.RECAPTCHA_ENABLED, false);
  const enforce = normalizeBool(process.env.RECAPTCHA_ENFORCE, false);
  const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const isLocalReq = /localhost|127\.0\.0\.1/i.test(hostHeader);
  const shouldEnforce = enabled && enforce && !isLocalReq;

  if (!enabled) return { ok: true, reason: 'disabled' };
  if (!shouldEnforce) {
    log.debug(`visual-only (${context}) enforce:${enforce} host:${hostHeader}`);
    return { ok: true, reason: 'not-enforced' };
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    return { ok: false, message: 'Validación reCAPTCHA requerida' };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    log.warn('enabled but missing RECAPTCHA_SECRET_KEY');
    return { ok: false, message: 'Error de configuración del servidor reCAPTCHA' };
  }

  const verifyURL = 'https://www.google.com/recaptcha/api/siteverify';
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  if (clientIp) params.append('remoteip', clientIp);

  try {
    const { data: gResp } = await axios.post(verifyURL, params, { timeout: 5000 });
    log.debug('resp', gResp);
    if (gResp && gResp.success === true) return { ok: true };
    const codes = Array.isArray(gResp && gResp['error-codes']) ? gResp['error-codes'] : [];
    let message = 'Validación reCAPTCHA fallida';
    if (codes.includes('missing-input-response')) message = 'Por favor completa el reCAPTCHA';
    else if (codes.includes('invalid-input-response')) message = 'reCAPTCHA inválido. Recarga la página e inténtalo de nuevo';
    else if (codes.includes('timeout-or-duplicate')) message = 'El reCAPTCHA expiró. Vuelve a marcar la casilla';
    else if (codes.includes('invalid-input-secret') || codes.includes('missing-input-secret')) message = 'Error de configuración del servidor reCAPTCHA';
    else if (codes.includes('bad-request')) message = 'Solicitud reCAPTCHA inválida';
    return { ok: false, message, detalle: codes.join(', ') || 'fallo de verificación' };
  } catch (e) {
    log.error('verify error:', e.message);
    return { ok: false, message: 'Error al verificar reCAPTCHA' };
  }
}

module.exports = { verifyRecaptcha };
