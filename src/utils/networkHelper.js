const crypto = require('crypto');
const env    = require('../config/env');

const ALGO = 'aes-256-cbc';
const KEY  = Buffer.from(env.ENCRYPTION_KEY, 'hex');

const encrypt = (text) => {
  const iv         = crypto.randomBytes(16);
  const cipher     = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted  = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (ciphertext) => {
  const [ivHex, encHex] = ciphertext.split(':');
  const iv              = Buffer.from(ivHex,  'hex');
  const enc             = Buffer.from(encHex, 'hex');
  const decipher        = crypto.createDecipheriv(ALGO, KEY, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
};

/**
 * Validates a request against the attendance policy's allowed IP ranges and
 * optional SSID whitelist.
 * Returns { allowed: bool }.  NEVER throws details to caller.
 */
const validateNetworkAccess = (req, policy) => {
  try {
    const clientIp   = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const clientSsid = req.headers['x-network-ssid'] || '';

    let allowedIps   = [];
    let allowedSsids = [];

    if (policy.allowed_ips_encrypted) {
      allowedIps = JSON.parse(decrypt(policy.allowed_ips_encrypted));
    }
    if (policy.allowed_ssids_encrypted) {
      allowedSsids = JSON.parse(decrypt(policy.allowed_ssids_encrypted));
    }

    const ipOk   = allowedIps.length   === 0 || allowedIps.some((range) => ipInRange(clientIp, range));
    const ssidOk = allowedSsids.length === 0 || allowedSsids.includes(clientSsid);

    return { allowed: ipOk && ssidOk };
  } catch (_) {
    return { allowed: false };
  }
};

// Very simple CIDR / exact-match check
const ipInRange = (ip, range) => {
  if (!range.includes('/')) return ip === range;
  const [network, bits]  = range.split('/');
  const mask             = ~(2 ** (32 - parseInt(bits)) - 1);
  const toInt            = (s) => s.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
  return (toInt(ip) & mask) === (toInt(network) & mask);
};

module.exports = { encrypt, decrypt, validateNetworkAccess };
