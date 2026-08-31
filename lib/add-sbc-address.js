const { randomUUID: uuid } = require('crypto');

// A single atomic upsert against the UNIQUE INDEX on (ipv4, port), so
// concurrent sbc-sip-sidecar registrations of the same IP/port cannot create
// duplicate rows (the reason INSERT IGNORE was adopted in #51).
//
// The ON DUPLICATE KEY UPDATE clause is what makes this function usable as the
// SBC keepalive: cleanSbcAddresses() deletes rows whose last_updated has aged
// past DEAD_SBC_IN_SECOND, so an existing row MUST have its timestamp refreshed
// on every call. A plain INSERT IGNORE leaves last_updated frozen at the
// original insert, after which the cleaner reaps a perfectly healthy SBC.
const insertSql = `INSERT INTO sbc_addresses
(sbc_address_sid, ipv4, port, tls_port, wss_port, last_updated)
VALUES (?, ?, ?, ?, ?, NOW())
ON DUPLICATE KEY UPDATE
tls_port = VALUES(tls_port), wss_port = VALUES(wss_port), last_updated = NOW()`;

/**
 * Register an SBC address, or refresh it if already registered.
 * Atomic upsert: safe against concurrent registrations, and refreshes
 * last_updated so the row survives cleanSbcAddresses().
 * @param {*} pool
 * @param {*} logger
 * @param {string} ipv4 - The IP address
 * @param {number} port - The SIP port (default 5060)
 * @param {number|null} tls_port - The TLS port
 * @param {number|null} wss_port - The WSS port
 */
async function addSbcAddress(pool, logger, ipv4, port = 5060, tls_port = null, wss_port = null) {
  try {
    const pp = pool.promise();
    await pp.execute(insertSql, [uuid(), ipv4, port, tls_port, wss_port]);
  } catch (err) {
    logger.error({err}, 'Error adding SBC address to the database');
  }
}

module.exports = addSbcAddress;
